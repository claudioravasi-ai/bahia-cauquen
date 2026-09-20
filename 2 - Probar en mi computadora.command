#!/bin/bash
# Doble clic y deja la app andando en esta computadora para mirarla.
# Después abrí el navegador en:   http://localhost:8820/?local
cd "$(dirname "$0")" || exit 1
printf "\033c" 2>/dev/null || true
echo "================================================="
echo "  Barrio Bahía Cauquén — probar en esta máquina"
echo "================================================="
echo
echo "  Abrí el navegador en:"
echo
echo "      http://localhost:8820/?local"
echo
echo "  (el ?local hace que use datos de prueba y no"
echo "   toque la base del barrio)"
echo
echo "  Para terminar: apretá Control + C, o cerrá"
echo "  esta ventana."
echo "================================================="
echo
python3 -m http.server 8820
