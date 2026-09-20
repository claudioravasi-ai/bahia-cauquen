#!/bin/bash
# Doble clic en este archivo y listo. Hace las dos cosas del Paso 0:
#   1. revisa que no haya nombres repetidos entre archivos (el error que
#      deja media app sin responder),
#   2. sella la versión, para que los celulares reciban lo nuevo.
cd "$(dirname "$0")" || exit 1
printf "\033c" 2>/dev/null || true
echo "================================================="
echo "  Barrio Bahía Cauquén — revisar y sellar"
echo "================================================="
echo
python3 revisar.py
ESTADO=$?
echo
if [ $ESTADO -ne 0 ]; then
  echo "-------------------------------------------------"
  echo "  HAY UN PROBLEMA. NO SUBAS NADA a GitHub."
  echo "  Copiá lo que dice acá arriba y pasámelo."
  echo "-------------------------------------------------"
else
  python3 version.py
  echo
  echo "-------------------------------------------------"
  echo "  LISTO. Ya podés subir los archivos a GitHub."
  echo "  Acordate de subir tambien index.html y sw.js."
  echo "-------------------------------------------------"
fi
echo
echo "Podés cerrar esta ventana."
