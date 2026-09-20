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

print(f'Todo en orden: {len(orden)} archivos, {len(donde)} nombres, sin choques.')
