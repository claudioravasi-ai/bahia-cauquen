#!/usr/bin/env python3
"""
Revisión rápida antes de publicar.

Busca la clase de error que rompe la app entera sin avisar: un nombre
declarado dos veces en archivos distintos. Como todos los .js comparten el
mismo espacio de nombres, un `const X` repetido en dos archivos hace que el
SEGUNDO archivo no se ejecute: la app arranca, se ve, pero media pantalla
deja de responder. Es exactamente lo que pasa cuando "no se puede entrar a
ninguna ventana".

    python3 revisar.py
"""
import re, pathlib, collections, sys

raiz = pathlib.Path(__file__).parent
html = (raiz / 'index.html').read_text(encoding='utf-8')
orden = re.findall(r'src="(js/[a-z\-]+\.js)', html)

# Nombres declarados en el nivel superior de cada archivo (sin sangría).
patron = re.compile(r'^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)', re.M)
donde = collections.defaultdict(list)
for rel in orden:
    f = raiz / rel
    if not f.exists():
        print(f'FALTA el archivo {rel}, que index.html carga'); sys.exit(1)
    for nombre in patron.findall(f.read_text(encoding='utf-8')):
        donde[nombre].append(rel)

choques = {n: fs for n, fs in donde.items() if len(set(fs)) > 1 or len(fs) > 1}
if choques:
    print('Nombres declarados más de una vez (rompen el archivo que va segundo):\n')
    for n, fs in sorted(choques.items()):
        print(f'  {n}  →  {", ".join(fs)}')
    sys.exit(1)

# Todo archivo que exista tiene que estar en index.html y en el service worker.
sw = (raiz / 'sw.js').read_text(encoding='utf-8')
for f in sorted((raiz / 'js').glob('*.js')):
    rel = f'js/{f.name}'
    if rel not in html: print(f'AVISO: {rel} existe pero index.html no lo carga')
    if f.name not in sw: print(f'AVISO: {rel} no está en la lista del service worker')

# La lista PIEZAS de app.js es la que, al arrancar, detecta que el equipo
# quedó con un index.html viejo (le falta algún .js) y repara la app sola.
# Si alguien agrega un archivo nuevo y se olvida de esa lista, la reparación
# deja de ver ese archivo y vuelve el problema de la app a medias.
app = (raiz / 'js' / 'app.js').read_text(encoding='utf-8')
bloque = re.search(r'const PIEZAS = \[(.*?)\];', app, re.S)
if not bloque:
    print('AVISO: no encontré la lista PIEZAS en js/app.js')
else:
    vigiladas = set(re.findall(r"'(js/[a-z\-]+\.js)'", bloque.group(1)))
    # firebase-config.js es opcional (la app anda sin nube) y app.js es el que mira.
    esperadas = {r for r in orden if r not in ('js/firebase-config.js', 'js/app.js')}
    if esperadas - vigiladas:
        print('Estos archivos se cargan pero PIEZAS (js/app.js) no los vigila:\n')
        for r in sorted(esperadas - vigiladas): print(f'  {r}')
        sys.exit(1)
    if vigiladas - esperadas:
        print('PIEZAS (js/app.js) vigila archivos que index.html ya no carga:\n')
        for r in sorted(vigiladas - esperadas): print(f'  {r}')
        sys.exit(1)

print(f'Todo en orden: {len(orden)} archivos, {len(donde)} nombres, sin choques.')
