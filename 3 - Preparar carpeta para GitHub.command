#!/bin/bash
# Doble clic y arma en el Escritorio una carpeta con EXACTAMENTE lo que va a
# GitHub, sin lo privado. Después se arrastra el contenido de esa carpeta al
# repositorio. Se puede volver a correr todas las veces que haga falta.
cd "$(dirname "$0")" || exit 1
printf "\033c" 2>/dev/null || true
DESTINO="$HOME/Desktop/SUBIR A GITHUB"

echo "================================================="
echo "  Barrio Bahía Cauquén — preparar la subida"
echo "================================================="
echo

# Primero revisa y sella: no tiene sentido preparar algo roto o sin versión.
python3 revisar.py || {
  echo
  echo "-------------------------------------------------"
  echo "  HAY UN PROBLEMA. No preparo nada."
  echo "  Copiá lo que dice arriba y pasámelo."
  echo "-------------------------------------------------"
  echo; echo "Podés cerrar esta ventana."; exit 1
}
python3 version.py
echo

rm -rf "$DESTINO"
mkdir -p "$DESTINO"

# Lo que SÍ va
cp index.html manifest.webmanifest sw.js reglas-firebase.txt .gitignore "$DESTINO"/
cp revisar.py version.py "$DESTINO"/
cp *.md "$DESTINO"/
cp -R css js img icons apps-script "$DESTINO"/

# Por las dudas: nada privado ni basura de macOS
rm -rf "$DESTINO/datos-privados"
find "$DESTINO" -name '.DS_Store' -delete
find "$DESTINO" -name '*.pdf' -delete

echo "-------------------------------------------------"
echo "  LISTO. Se armó en el Escritorio la carpeta:"
echo
echo "      SUBIR A GITHUB"
echo
echo "  Abrila, seleccioná TODO lo que hay adentro"
echo "  (Cmd+A) y arrastrá ESO al repositorio."
echo "  Ojo: el contenido, no la carpeta entera."
echo "-------------------------------------------------"
echo
echo "Lo que quedó adentro:"
echo
(cd "$DESTINO" && find . -type f | sed 's|^\./|   |' | sort)
echo
echo "Podés cerrar esta ventana."
open "$DESTINO" 2>/dev/null
