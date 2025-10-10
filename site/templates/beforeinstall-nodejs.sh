CUR="$PWD"
while true; do
  if [ -f "$CUR/.nvmrc" ]; then
    VERSION="$(cat "$CUR/.nvmrc")"
    break
  fi
  if [ -d "$CUR/.git" ]; then
    break
  fi
  NEXT=$(dirname $CUR)
  if [ "$NEXT" = "$CUR" ]; then
    break
  fi
  CUR="$NEXT"
done