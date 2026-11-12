# -*- coding: utf-8 -*-
"""Genera el Manual funcional de HRU Quirófanos en Word y en PDF.

    python3 manual/generar.py

Lee `manual/contenido.py` (la única fuente) y deja en la raíz del repositorio:
  · HRU-Quirofanos-Manual-Funcional-v<versión>.docx
  · manual-funcional-hru-quirofanos.pdf   ← el que abre la app desde Descargas

El Word se escribe directamente en OOXML (zip + XML) porque el equipo no tiene
node, pandoc ni LibreOffice. El PDF sale de una versión HTML del mismo contenido
impresa con Chrome sin interfaz.
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import contenido as C  # noqa: E402

TEAL = '1F6F7E'
TEAL_2 = '17616D'
TINTA = '1F2937'
GRIS = '6B7280'
LINEA = 'CBD5E1'
FONDO_TABLA = 'DCEFF1'
FONDO_NOTA = 'EEF6F7'

# ───────────────────────────── texto con **negritas**
def trozos(texto):
    """Parte un texto en [(fragmento, negrita)] según los **…**."""
    partes = re.split(r'(\*\*[^*]+\*\*)', texto)
    out = []
    for p in partes:
        if not p:
            continue
        if p.startswith('**') and p.endswith('**'):
            out.append((p[2:-2], True))
        else:
            out.append((p, False))
    return out


# ═════════════════════════════════════════════════════════════ WORD (OOXML)
def x(s):
    return html.escape(s, quote=False)

def run(texto, negrita=False, tam=None, color=None, italica=False, versalitas=False, espaciado=None):
    rpr = []
    if negrita:
        rpr.append('<w:b/>')
    if italica:
        rpr.append('<w:i/>')
    if versalitas:
        rpr.append('<w:caps/>')
    if color:
        rpr.append(f'<w:color w:val="{color}"/>')
    if espaciado:
        rpr.append(f'<w:spacing w:val="{espaciado}"/>')
    if tam:
        rpr.append(f'<w:sz w:val="{tam}"/><w:szCs w:val="{tam}"/>')
    rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ''
    return f'<w:r>{rpr_xml}<w:t xml:space="preserve">{x(texto)}</w:t></w:r>'

def runs_de(texto, **kw):
    return ''.join(run(t, negrita=b or kw.get('negrita', False), **{k: v for k, v in kw.items() if k != 'negrita'})
                   for t, b in trozos(texto))

def parrafo(contenido_runs, estilo=None, alineado=None, antes=None, despues=None, extra_ppr=''):
    ppr = []
    if estilo:
        ppr.append(f'<w:pStyle w:val="{estilo}"/>')
    if antes is not None or despues is not None:
        ppr.append(f'<w:spacing w:before="{antes or 0}" w:after="{despues or 0}"/>')
    if alineado:
        ppr.append(f'<w:jc w:val="{alineado}"/>')
    ppr.append(extra_ppr)
    return f'<w:p><w:pPr>{"".join(ppr)}</w:pPr>{contenido_runs}</w:p>'

def salto_de_pagina():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

def celda(texto, ancho, encabezado=False):
    sombra = f'<w:shd w:val="clear" w:color="auto" w:fill="{FONDO_TABLA}"/>' if encabezado else ''
    contenido_celda = parrafo(runs_de(texto, negrita=encabezado, tam=19, color=TINTA if not encabezado else TEAL_2),
                              antes=40, despues=40)
    return (f'<w:tc><w:tcPr><w:tcW w:w="{ancho}" w:type="dxa"/>{sombra}</w:tcPr>{contenido_celda}</w:tc>')

def tabla(encabezados, filas):
    total = 9638  # ancho útil A4 con márgenes de 2 cm
    n = len(encabezados)
    # La primera columna algo más angosta cuando hay tres o más.
    if n >= 3:
        primera = int(total * 0.26)
        resto = (total - primera) // (n - 1)
        anchos = [primera] + [resto] * (n - 1)
    else:
        anchos = [total // n] * n
    bordes = ''.join(f'<w:{b} w:val="single" w:sz="4" w:space="0" w:color="{LINEA}"/>'
                     for b in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'))
    grid = ''.join(f'<w:gridCol w:w="{a}"/>' for a in anchos)
    enc = '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + ''.join(celda(t, anchos[i], True) for i, t in enumerate(encabezados)) + '</w:tr>'
    cuerpo = ''.join('<w:tr><w:trPr><w:cantSplit/></w:trPr>' + ''.join(celda(t, anchos[i]) for i, t in enumerate(f)) + '</w:tr>' for f in filas)
    return (f'<w:tbl><w:tblPr><w:tblW w:w="{total}" w:type="dxa"/><w:tblBorders>{bordes}</w:tblBorders>'
            f'<w:tblCellMar><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'
            f'<w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid>{grid}</w:tblGrid>{enc}{cuerpo}</w:tbl>'
            + parrafo('', despues=120))

def nota(texto):
    # Recuadro parejo en los cuatro lados: ningún canto más grueso que otro,
    # el mismo criterio que usa la app en sus ventanas.
    borde = ('<w:pBdr>' + ''.join(f'<w:{l} w:val="single" w:sz="6" w:space="6" w:color="{TEAL}"/>'
                                  for l in ('top', 'left', 'bottom', 'right')) + '</w:pBdr>'
             f'<w:shd w:val="clear" w:color="auto" w:fill="{FONDO_NOTA}"/><w:ind w:left="200" w:right="120"/>')
    return parrafo(runs_de(texto, tam=21, color=TINTA), antes=120, despues=160, extra_ppr=borde)

def cuerpo_word():
    P = C.PORTADA
    b = []
    # ── Portada
    b.append(parrafo('', antes=1400))
    b.append(parrafo(run(P['institucion'], negrita=True, tam=26, color=TEAL, espaciado=40), alineado='center', despues=60))
    b.append(parrafo(run(P['sub_institucion'], tam=18, color=GRIS), alineado='center', despues=360))
    b.append(parrafo(run(P['area'], negrita=True, tam=22, color=TINTA, espaciado=30), alineado='center', despues=120))
    b.append(parrafo(run(P['titulo'], negrita=True, tam=64, color=TEAL), alineado='center', despues=160))
    b.append(parrafo(run(P['subtitulo'], tam=30, color=TINTA), alineado='center', despues=160))
    b.append(parrafo(run(P['bajada'], italica=True, tam=21, color=GRIS), alineado='center', despues=900))
    b.append(parrafo(run(f'Versión {C.VERSION} · {C.FECHA}', negrita=True, tam=22, color=TEAL_2), alineado='center', despues=80))
    b.append(parrafo(run(P['destinatarios'], tam=19, color=GRIS), alineado='center', despues=80))
    b.append(parrafo(run(P['temas'], tam=17, color=GRIS), alineado='center'))
    # ── Contenido. El salto después de la portada va DENTRO del primer título
    # (pageBreakBefore) y no como un párrafo aparte: algunos visores que no son
    # Word dibujaban ese párrafo como un cuadradito.
    primero = True
    for bloque in C.BLOQUES:
        tipo = bloque[0]
        if tipo == 'h1':
            b.append(parrafo(run(bloque[1]), estilo='Ttulo1', extra_ppr='<w:pageBreakBefore/>' if primero else ''))
            primero = False
        elif tipo == 'h2':
            b.append(parrafo(run(bloque[1]), estilo='Ttulo2'))
        elif tipo == 'h3':
            b.append(parrafo(run(bloque[1]), estilo='Ttulo3'))
        elif tipo == 'p':
            b.append(parrafo(runs_de(bloque[1]), estilo='Normal'))
        elif tipo == 'ul':
            for item in bloque[1]:
                b.append(parrafo(runs_de(item), estilo='Vieta',
                                 extra_ppr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'))
        elif tipo == 'nota':
            b.append(nota(bloque[1]))
        elif tipo == 'tabla':
            b.append(tabla(bloque[1], bloque[2]))
    # ── Cierre
    b.append(parrafo('', antes=240))
    b.append(parrafo(run(f'HRU Quirófanos · Versión {C.VERSION} · {C.FECHA}', negrita=True, tam=19, color=TEAL_2), alineado='center', despues=80))
    for linea in C.PIE:
        b.append(parrafo(run(linea, tam=16, color=GRIS), alineado='center', despues=60))
    return ''.join(b)

ESTILOS = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
 <w:docDefaults>
  <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/>
   <w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="{TINTA}"/><w:lang w:val="es-AR"/></w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
 </w:docDefaults>
 <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/>
  <w:pPr><w:jc w:val="both"/></w:pPr></w:style>
 <w:style w:type="paragraph" w:styleId="Ttulo1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
  <w:pPr><w:keepNext/><w:spacing w:before="420" w:after="160"/><w:jc w:val="left"/><w:outlineLvl w:val="0"/>
   <w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="{TEAL}"/></w:pBdr></w:pPr>
  <w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="{TEAL}"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Ttulo2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
  <w:pPr><w:keepNext/><w:spacing w:before="260" w:after="100"/><w:jc w:val="left"/><w:outlineLvl w:val="1"/></w:pPr>
  <w:rPr><w:b/><w:sz w:val="25"/><w:szCs w:val="25"/><w:color w:val="{TEAL_2}"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Ttulo3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
  <w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:jc w:val="left"/><w:outlineLvl w:val="2"/></w:pPr>
  <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="{TINTA}"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Vieta"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:spacing w:after="80"/><w:ind w:left="400" w:hanging="260"/></w:pPr></w:style>
 <w:style w:type="paragraph" w:styleId="Piedepgina"><w:name w:val="footer"/><w:basedOn w:val="Normal"/>
  <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="16"/><w:color w:val="{GRIS}"/></w:rPr></w:style>
</w:styles>'''

NUMERACION = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
 <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>
  <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>
   <w:pPr><w:ind w:left="400" w:hanging="260"/></w:pPr><w:rPr><w:color w:val="{TEAL}"/></w:rPr></w:lvl>
 </w:abstractNum>
 <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

def pie_word():
    texto = f'HRU Quirófanos · Manual funcional · versión {C.VERSION} · página '
    campo = ('<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
             '<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:p><w:pPr><w:pStyle w:val="Piedepgina"/></w:pPr>{run(texto)}{campo}</w:p></w:ftr>')

def documento_word():
    sect = ('<w:sectPr><w:footerReference w:type="default" r:id="rIdPie"/>'
            '<w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>'
            '<w:titlePg/></w:sectPr>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'<w:body>{cuerpo_word()}{sect}</w:body></w:document>')

def escribir_word(ruta):
    tipos = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
             '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
             '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
             '<Default Extension="xml" ContentType="application/xml"/>'
             '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
             '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
             '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
             '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
             '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
             '</Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            '</Relationships>')
    doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rIdEst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                '<Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
                '<Relationship Id="rIdPie" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
                '</Relationships>')
    core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>HRU Quirófanos — Manual funcional {C.VERSION}</dc:title>'
            '<dc:creator>Bloque de Quirófanos Centrales — Hospital Regional Ushuaia</dc:creator>'
            '<dc:language>es-AR</dc:language></cp:coreProperties>')
    with zipfile.ZipFile(ruta, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', tipos)
        z.writestr('_rels/.rels', rels)
        z.writestr('word/_rels/document.xml.rels', doc_rels)
        z.writestr('word/document.xml', documento_word())
        z.writestr('word/styles.xml', ESTILOS)
        z.writestr('word/numbering.xml', NUMERACION)
        z.writestr('word/footer1.xml', pie_word())
        z.writestr('docProps/core.xml', core)


# ═════════════════════════════════════════════════════════════ HTML → PDF
def h(texto):
    return ''.join(f'<b>{html.escape(t)}</b>' if b else html.escape(t) for t, b in trozos(texto))

def documento_html():
    P = C.PORTADA
    partes = [f'''<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>HRU Quirófanos — Manual funcional {C.VERSION}</title>
<style>
  @page {{ size: A4; margin: 20mm 20mm 18mm 20mm;
    @bottom-center {{ content: "HRU Quirófanos · Manual funcional · versión {C.VERSION} · página " counter(page);
                      font: 8pt Calibri, 'Helvetica Neue', Arial, sans-serif; color: #{GRIS}; }} }}
  @page :first {{ @bottom-center {{ content: none; }} }}
  body {{ font: 10.5pt/1.5 Calibri, 'Helvetica Neue', Arial, sans-serif; color: #{TINTA}; margin: 0; }}
  .portada {{ height: 250mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; }}
  .portada .inst {{ font-weight: 700; font-size: 13pt; letter-spacing: .08em; color: #{TEAL}; }}
  .portada .sub {{ font-size: 9pt; color: #{GRIS}; margin-bottom: 26mm; }}
  .portada .area {{ font-weight: 700; font-size: 11pt; letter-spacing: .06em; }}
  .portada .tit {{ font-weight: 800; font-size: 34pt; color: #{TEAL}; margin: 6mm 0 4mm; }}
  .portada .subt {{ font-size: 15pt; }}
  .portada .baj {{ font-style: italic; color: #{GRIS}; font-size: 10.5pt; margin: 4mm 18mm 34mm; }}
  .portada .ver {{ font-weight: 700; color: #{TEAL_2}; font-size: 11pt; }}
  .portada .des, .portada .tem {{ color: #{GRIS}; font-size: 9pt; margin-top: 2mm; }}
  h1 {{ font-size: 16pt; color: #{TEAL}; border-bottom: 1.2pt solid #{TEAL}; padding-bottom: 3pt; margin: 22pt 0 9pt; break-after: avoid; }}
  h2 {{ font-size: 12.5pt; color: #{TEAL_2}; margin: 15pt 0 6pt; break-after: avoid; }}
  h3 {{ font-size: 11pt; margin: 12pt 0 4pt; break-after: avoid; }}
  p {{ margin: 0 0 7pt; text-align: justify; }}
  ul {{ margin: 0 0 8pt; padding-left: 16pt; }}
  li {{ margin-bottom: 4pt; text-align: justify; }}
  li::marker {{ color: #{TEAL}; }}
  .nota {{ background: #{FONDO_NOTA}; border: .8pt solid #{TEAL}; padding: 7pt 10pt; margin: 8pt 0 11pt; break-inside: avoid; }}
  table {{ width: 100%; border-collapse: collapse; margin: 4pt 0 12pt; font-size: 9.5pt; }}
  th, td {{ border: .6pt solid #{LINEA}; padding: 4pt 6pt; vertical-align: top; text-align: left; }}
  th {{ background: #{FONDO_TABLA}; color: #{TEAL_2}; }}
  tr {{ break-inside: avoid; }}
  thead {{ display: table-header-group; }}
  .cierre {{ text-align: center; margin-top: 18pt; color: #{GRIS}; font-size: 8.5pt; }}
  .cierre .v {{ color: #{TEAL_2}; font-weight: 700; font-size: 9.5pt; }}
</style></head><body>
<div class="portada">
  <div class="inst">{html.escape(P['institucion'])}</div><div class="sub">{html.escape(P['sub_institucion'])}</div>
  <div class="area">{html.escape(P['area'])}</div><div class="tit">{html.escape(P['titulo'])}</div>
  <div class="subt">{html.escape(P['subtitulo'])}</div><div class="baj">{html.escape(P['bajada'])}</div>
  <div class="ver">Versión {C.VERSION} · {C.FECHA}</div>
  <div class="des">{html.escape(P['destinatarios'])}</div><div class="tem">{html.escape(P['temas'])}</div>
</div>''']
    for bloque in C.BLOQUES:
        tipo = bloque[0]
        if tipo in ('h1', 'h2', 'h3'):
            partes.append(f'<{tipo}>{html.escape(bloque[1])}</{tipo}>')
        elif tipo == 'p':
            partes.append(f'<p>{h(bloque[1])}</p>')
        elif tipo == 'ul':
            partes.append('<ul>' + ''.join(f'<li>{h(i)}</li>' for i in bloque[1]) + '</ul>')
        elif tipo == 'nota':
            partes.append(f'<div class="nota">{h(bloque[1])}</div>')
        elif tipo == 'tabla':
            enc = ''.join(f'<th>{h(t)}</th>' for t in bloque[1])
            filas = ''.join('<tr>' + ''.join(f'<td>{h(c)}</td>' for c in f) + '</tr>' for f in bloque[2])
            partes.append(f'<table><thead><tr>{enc}</tr></thead><tbody>{filas}</tbody></table>')
    partes.append(f'<div class="cierre"><div class="v">HRU Quirófanos · Versión {C.VERSION} · {C.FECHA}</div>'
                  + ''.join(f'<p style="text-align:center;margin:3pt 0">{html.escape(l)}</p>' for l in C.PIE) + '</div>')
    partes.append('</body></html>')
    return ''.join(partes)

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

def escribir_pdf(ruta):
    """Chrome sin interfaz, en macOS, a veces escribe el PDF y no termina nunca.
    Por eso no se espera a que salga: se espera a que el archivo exista y deje
    de crecer, y recién ahí se cierra ese Chrome —solo ese, por su perfil
    temporal— y se copia el PDF a su lugar. Se imprime en una carpeta temporal
    porque macOS puede frenar a Chrome al escribir en el Escritorio."""
    import shutil
    import time
    with tempfile.TemporaryDirectory() as tmp:
        fuente = os.path.join(tmp, 'manual.html')
        salida = os.path.join(tmp, 'manual.pdf')
        with open(fuente, 'w', encoding='utf-8') as f:
            f.write(documento_html())
        proc = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                                 f'--user-data-dir={os.path.join(tmp, "perfil")}',
                                 f'--print-to-pdf={salida}', 'file://' + fuente],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tam_anterior, estable_desde, limite = -1, None, time.time() + 120
        try:
            while time.time() < limite:
                if proc.poll() is not None and os.path.exists(salida):
                    break
                if os.path.exists(salida):
                    tam = os.path.getsize(salida)
                    if tam > 0 and tam == tam_anterior:
                        if estable_desde and time.time() - estable_desde > 1.5:
                            break
                        estable_desde = estable_desde or time.time()
                    else:
                        estable_desde = None
                    tam_anterior = tam
                time.sleep(0.3)
            else:
                raise RuntimeError('Chrome no generó el PDF en 2 minutos')
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
        shutil.copyfile(salida, ruta)


# ═════════════════════════════════════════ JSON (pantalla «Manual y Libro Blanco»)
ICONOS_USO = ['🧭', '👤', '🩺', '🚑', '🏥', '🔎', '🗂', '📝', '📊', '📦', '📣', '🔒', '⭐', '✨', '⏱']


def html_de(texto):
    """**negrita** → <b>, el resto escapado."""
    return ''.join(f'<b>{x(t)}</b>' if b else x(t) for t, b in trozos(texto))


def escribir_json(ruta):
    """El mismo contenido, por capítulos, para leerlo dentro de la app: cada
    `h1` es un capítulo; `h2`/`h3`, subtítulos; `ul`, viñetas; `nota`, recuadro."""
    caps, cap = [], None
    for b in C.BLOQUES:
        tipo = b[0]
        if tipo == 'h1':
            m = re.match(r'^(\d+)\.\s*(.+)$', b[1])
            cap = {'id': 'mu%d' % (len(caps) + 1), 'n': len(caps) + 1, 't': m.group(2) if m else b[1], 'b': []}
            cap['i'] = ICONOS_USO[(cap['n'] - 1) % len(ICONOS_USO)]
            caps.append(cap)
        elif cap is None:
            continue
        elif tipo in ('h2', 'h3'):
            cap['b'].append(['h', html_de(b[1])])
        elif tipo == 'p':
            cap['b'].append(['p', html_de(b[1])])
        elif tipo == 'ul':
            cap['b'].append(['lista', [html_de(i) for i in b[1]]])
        elif tipo == 'nota':
            cap['b'].append(['ojo', html_de(b[1])])
        elif tipo == 'tabla':
            cap['b'].append(['tabla', [html_de(c) for c in b[1]], [[html_de(c) for c in f] for f in b[2]]])
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump({'version': C.VERSION, 'caps': caps}, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    js = os.path.join(RAIZ, 'manual', 'manual-uso.json')
    escribir_json(js)
    print('JSON:', js, os.path.getsize(js), 'bytes')
    docx = os.path.join(RAIZ, f'HRU-Quirofanos-Manual-Funcional-v{C.VERSION}.docx')
    pdf = os.path.join(RAIZ, 'manual-funcional-hru-quirofanos.pdf')
    escribir_word(docx)
    print('Word:', docx, os.path.getsize(docx), 'bytes')
    escribir_pdf(pdf)
    print('PDF: ', pdf, os.path.getsize(pdf), 'bytes')
