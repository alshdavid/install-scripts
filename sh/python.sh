#!/usr/bin/sh
set -e

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`

# Detect Python Version
VERSION="$PYTHON_VERSION"

while [ $# -gt 0 ]; do
  case "$1" in
    --version*|-v*)
      case "$1" in
        *=*)
          VERSION="${1#*=}"
          ;;
      esac
      ;;
    --out-dir*|-o*)
      case "$1" in
        *=*)
          OUT_DIR="${1#*=}"
          ;;
      esac
      ;;
    *)
      echo "Error: Invalid argument" >&2
      exit 1
      ;;
  esac
  shift
done

# Find .pyvm
if [ "$VERSION" = "" ]; then 
  CUR="$SCRIPT_DIR"
  while true; do
    if [ -f "$CUR/.pyvm" ]; then
      VERSION="$(cat "$CUR/.pyvm")"
      break
    fi
    if [ -f "$CUR/.python_version" ]; then
      VERSION="$(cat "$CUR/.python_version")"
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
fi

if [ "$VERSION" = "" ]; then
  echo "Unable to fetch version"
  exit 1
fi

# Default to home directory
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/python"
fi

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

if [ "$OS" = "" ]; then
  echo "Unable to determine version"
  exit 1
fi

>&2 echo ARCH: $ARCH
>&2 echo OS: $OS

URL=$(curl -s "http://sh.davidalsh.com/versions/python/${OS}-${ARCH}-${VERSION}" | tr -d " \t\n\r")

if [ "$URL" = "" ]; then
  echo "Cannot find archive"
  exit 1
fi

>&2 echo URL: $URL

test -d $OUT_DIR && rm -rf $OUT_DIR
mkdir -p $OUT_DIR
mkdir -p $OUT_DIR/tmp/$VERSION

curl -s -L --url $URL | tar -xzf - -C $OUT_DIR/tmp/$VERSION
mv $OUT_DIR/tmp/$VERSION/python $OUT_DIR/$VERSION
rm -rf $OUT_DIR/tmp

if [ "${OS}" = "windows" ]; then
  echo "export PATH=\"${OUT_DIR}/${VERSION}:\$PATH\""

  if [ "$GITHUB_PATH" != "" ]; then
    echo "${OUT_DIR}/${VERSION}" >> $GITHUB_PATH
  fi
else
  echo "export PATH=\"${OUT_DIR}/${VERSION}/bin:\$PATH\""

  if [ "$GITHUB_PATH" != "" ]; then
    echo "${OUT_DIR}/${VERSION}/bin" >> $GITHUB_PATH
  fi
fi
