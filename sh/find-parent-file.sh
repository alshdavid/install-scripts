#!/bin/bash
set -e

SCRIPT_DIR=$PWD

VAR_NAME="$1"
>&2 echo VAR_NAME: $VAR_NAME

TARGET="$2"
>&2 echo TARGET: $TARGET

OUTPUT=""

CUR="$SCRIPT_DIR"
while true; do
  if [ -f "$CUR/$TARGET" ]; then
    OUTPUT="$(cat "$CUR/$TARGET")"
    break
  fi
  NEXT=$(dirname $CUR)
  if [ "$NEXT" = "$CUR" ]; then
    break
  fi
  CUR="$NEXT"
done

if [ "$OUTPUT" = "" ]; then
  >&2 echo Unable to find file
  exit 1
fi

echo "export \$${VAR_NAME}=\"${OUTPUT}\""

if ! [ "$GITHUB_ENV" = "" ]; then
  echo "${VAR_NAME}=\"${OUTPUT}\"" >> $GITHUB_ENV
fi
