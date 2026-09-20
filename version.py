#!/usr/bin/env python3
"""
Sella la versión de la app.

Por qué existe: el navegador y el service worker guardan los archivos para
que la app abra sin internet. Si se publica una versión nueva con los mismos
nombres de archivo, muchos equipos siguen usando los viejos y queda una app
mitad nueva y mitad vieja: botones que no responden, ventanas que no abren.
Poniendo ?v=<version> en cada archivo, la dirección cambia y el navegador
está obligado a bajar lo nuevo.

CÓMO SE USA
    python3 version.py            -> sella con la fecha y hora de ahora
    python3 version.py 3.2.0      -> sella con ese número

SE CORRE SIEMPRE ANTES DE SUBIR A GITHUB. Si no, los vecinos pueden quedar
con la versión anterior durante días.
"""
import re, sys, datetime, pathlib

raiz = pathlib.Path(__file__).parent
v = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

html = (raiz / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'(src="js/[a-z\-]+\.js)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={v}"', html)
html = re.sub(r'(href="css/app\.css)(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={v}"', html)
html = re.sub(r'window\.VERSION="[^"]*"', f'window.VERSION="{v}"', html)
(raiz / 'index.html').write_text(html, encoding='utf-8')

sw = (raiz / 'sw.js').read_text(encoding='utf-8')
sw = re.sub(r"const CACHE = '[^']*';", f"const CACHE = 'bhc-{v}';", sw)
sw = re.sub(r"'\./js/([a-z\-]+)\.js(\?v=[^']*)?'", lambda m: f"'./js/{m.group(1)}.js?v={v}'", sw)
sw = re.sub(r"'\./css/app\.css(\?v=[^']*)?'", f"'./css/app.css?v={v}'", sw)
(raiz / 'sw.js').write_text(sw, encoding='utf-8')

print(f'Versión sellada: {v}')
