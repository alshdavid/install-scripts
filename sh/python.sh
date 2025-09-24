#!/bin/sh
set -e

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`

# Detect Python Version
VERSION="$PYTHON_VERSION"

# Default to home directory
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/$NAME"
fi

if [ "$VERSION" = "" ]; then
  echo "Unable to fetch version"
  exit 1
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

echo "http://sh.davidalsh.com/versions/python/${OS}-${ARCH}-${VERSION}"
URL=$(curl -s "http://sh.davidalsh.com/versions/python/${OS}-${ARCH}-${VERSION}" | tr -d " \t\n\r")

if [ "$URL" = "" ]; then
  echo "Cannot find archive"
  exit 1
fi

>&2 echo URL: $URL

test -d $OUT_DIR/python && rm -rf $OUT_DIR/python
mkdir -p $OUT_DIR/python
mkdir -p $OUT_DIR/python/tmp/$VERSION

if [ -z "${URL##*.tar.gz}" ]; then
  curl -s -L --url $URL | tar -xzf - -C $OUT_DIR/python/tmp/$VERSION
  mv $OUT_DIR/python/tmp/$VERSION/python $OUT_DIR/python/$VERSION
  rm -rf $OUT_DIR/python/tmp
fi

if [ "${OS}" = "windows" ]; then
  echo "export PATH=\"${OUT_DIR}/python/${VERSION}:\$PATH\""

  if [ "$GITHUB_PATH" != "" ]; then
    echo "${OUT_DIR}/python/${VERSION}" >> $GITHUB_PATH
  fi
else
  echo "export PATH=\"${OUT_DIR}/python/${VERSION}/bin:\$PATH\""

  if [ "$GITHUB_PATH" != "" ]; then
    echo "${OUT_DIR}/python/${VERSION}/bin" >> $GITHUB_PATH
  fi
fi
