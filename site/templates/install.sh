#!/usr/bin/env sh

set -e

PACKAGE_NAME="<%- ctx.packageName %>"
VERSION="latest"
if ! [ "$<%- ctx.PACKAGE_NAME %>_VERSION" = "" ]; then
  VERSION="$<%- ctx.PACKAGE_NAME %>_VERSION"
fi

URL=""
OUT_DIR="$HOME/.local/$PACKAGE_NAME"
if ! [ "$<%- ctx.PACKAGE_NAME %>_OUT_DIR" = "" ]; then
  OUT_DIR="$<%- ctx.PACKAGE_NAME %>_OUT_DIR"
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --version*)
      if [[ "$1" != *=* ]]; then shift; fi
      VERSION="${1#*=}"
      ;;
    --out-dir*)
      if [[ "$1" != *=* ]]; then shift; fi # Value is next arg if no `=`
      OUT_DIR="${1#*=}"
      ;;
      *)
      >&2 printf "Error: Invalid argument\n"
      exit 1
      ;;
  esac
  shift
done

# Convert paths to absolute
case "$OUT_DIR" in
  .)
    OUT_DIR="$PWD"
  ;;
  .*)
    OUT_DIR="$PWD${OUT_DIR#"."}"
  ;;
  ~)
    OUT_DIR="$HOME"
  ;;
  ~*)
    OUT_DIR="$HOME${OUT_DIR#"~"}"
  ;;
esac

if [ -f $OUT_DIR ]; then
  >&2 echo OUT_DIR: $OUT_DIR already exists and is a file
  exit 1
fi

# Version from .<%- ctx.package_name %>_version
CUR="$PWD"
while true; do
  if [ -f "$CUR/.<%- ctx.package_name %>_version" ]; then
    VERSION="$(cat "$CUR/.<%- ctx.package_name %>_version")"
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

<% if (ctx.fs.exists(ctx.path.join(ctx.dirname, `beforeinstall-${ctx.packageName}.sh`))) { %>
<%- await include(ctx.path.join(ctx.dirname, `beforeinstall-${ctx.packageName}.sh`)) %>
<% } %>

if [ "$VERSION" = "" ]; then 
  VERSION="latest"
fi

>&2 echo PACKAGE_NAME: $PACKAGE_NAME
>&2 echo VERSION: $VERSION
>&2 echo OUT_DIR: $OUT_DIR

ARCH=""
case "$(uname -m)" in
  x86_64 | x86-64 | x64 | amd64) ARCH="amd64";;
  aarch64 | arm64) ARCH="arm64";;
  *) ARCH="";;
esac

OS=""
case "$(uname -s)" in
  Darwin) OS="macos";;
  Linux) OS="linux";;
  MINGW64_NT* | Windows_NT | MSYS_NT*) OS="windows";;
  *) OS="";;
esac

>&2 echo ARCH: $ARCH
>&2 echo OS: $OS

COMPRESSION_FORMAT=""
if command -v xz >/dev/null 2>&1
then
  COMPRESSION_FORMAT="xz"
elif command -v gzip >/dev/null 2>&1
then
  >&2 echo Warning: xz not installed, falling back to gz 
  COMPRESSION_FORMAT="gz"
else
  >&2 echo Error: No support for tar.xz or tar.gz, cannot uncompress archive
  exit 1
fi

>&2 echo COMPRESSION_FORMAT: $COMPRESSION_FORMAT

FETCH_URL="https://sh.davidalsh.com/packages/${PACKAGE_NAME}/${VERSION}_${OS}_${ARCH}_tar_${COMPRESSION_FORMAT}.txt"
>&2 echo VERSION_URL: $FETCH_URL

URL=$(curl -sSL "$FETCH_URL")
>&2 echo URL: $URL

if [ -d $OUT_DIR ]; then
  rm -rf "$OUT_DIR"
fi

mkdir -p $OUT_DIR

if [ "$COMPRESSION_FORMAT" = "xz" ]; then
  curl -s -L --url "$URL" | tar -xJf - -C $OUT_DIR
fi

if [ "$COMPRESSION_FORMAT" = "gz" ]; then
  curl -s -L --url "$URL" | tar -xzf - -C $OUT_DIR
fi

<% if (ctx.fs.exists(ctx.path.join(ctx.dirname, `postinstall-${ctx.packageName}.sh`))) { %>
<%- await include(ctx.path.join(ctx.dirname, `postinstall-${ctx.packageName}.sh`)) %>
<% } else { %>
<%- await include(ctx.path.join(ctx.dirname, 'postinstall.sh')) %>
<% } %>

if [ -f "$OUT_DIR/env" ]; then
  # Echo for variables to go into current shell
  sh $OUT_DIR/env
fi

>&2 echo "Done"
>&2 echo "Add the following to your .zshrc and .bashrc files:"
>&2 echo "  eval \$(sh \"${OUT_DIR}/env\")"
