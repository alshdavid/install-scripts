#!/bin/sh
set -e

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`

# Version from env
if ! [ "$NODEJS_VERSION" = "" ];then
  VERSION="$NODEJS_VERSION"
fi

if ! [ "$NODE_VERSION" = "" ];then
  VERSION="$NODE_VERSION"
fi

# Version from args
while [ $# -gt 0 ]; do
  case "$1" in
    --version*|-v*)
      case "$1" in
        *=*)
          VERSION="${1#*=}"
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

# Version from .nvmrc
if [ "$VERSION" = "" ]; then 
  CUR="$SCRIPT_DIR"
  while true; do
    if [ -f "$CUR/.nvmrc" ]; then
      VERSION="$(cat "$CUR/.nvmrc")"
      break
    fi
    if [ -f "$CUR/.nodejs_version" ]; then
      VERSION="$(cat "$CUR/.nodejs_version")"
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
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/latest)
fi

if [ "$VERSION" = "22" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/22)
fi
if [ "$VERSION" = "23" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/23)
fi
if [ "$VERSION" = "24" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/24)
fi
if [ "$VERSION" = "current" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/current)
fi
if [ "$VERSION" = "latest" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/nodejs/latest)
fi

OUT_DIR="$OUT_DIR"
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/nodejs"
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

>&2 echo ARCH: $ARCH
>&2 echo OS: $OS

URL=""
case "$OS-$ARCH" in
  linux-amd64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-linux-x64.tar.gz";;
  linux-arm64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-linux-arm64.tar.gz";;
  macos-amd64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-darwin-x64.tar.gz";;
  macos-arm64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-darwin-arm64.tar.gz";;
  windows-arm64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-win-arm64.zip";;
  windows-amd64) URL="https://nodejs.org/download/release/v${VERSION}/node-v${VERSION}-win-x64.zip";;
esac

if [ "$URL" = "" ]; then
  >&2 echo "Cannot find archive"
  exit 1
fi

>&2 echo URL: $URL
>&2 echo

OUT_DIR_INSTALL="${OUT_DIR}/${VERSION}"
PATH_PREFIX="${OUT_DIR_INSTALL}/prefix"
PATH_PREFIX_BIN="${OUT_DIR_INSTALL}/prefix/bin"

if [ "$OS" = "windows" ]; then
  PATH_BIN="${OUT_DIR_INSTALL}"
else
  PATH_BIN="${OUT_DIR_INSTALL}/bin"
fi

echo "export PATH=\"${PATH_BIN}:${PATH_PREFIX_BIN}:\$PATH\""
echo "export NPM_CONFIG_PREFIX=\"${PATH_PREFIX}\""

# Github CI
if ! [ "$GITHUB_PATH" = "" ]; then
  echo $PATH_BIN >> $GITHUB_PATH
  echo $PATH_PREFIX_BIN >> $GITHUB_PATH
fi

if ! [ "$GITHUB_ENV" = "" ]; then
  echo "NPM_CONFIG_PREFIX=${PATH_PREFIX}" >> $GITHUB_ENV
fi

rm -rf $OUT_DIR_INSTALL
mkdir -p $OUT_DIR_INSTALL
mkdir -p $OUT_DIR_INSTALL/prefix
mkdir -p $OUT_DIR_INSTALL/cache

if [ -z "${URL##*.tar.gz}" ]; then
  curl -s -L --url $URL | tar -xzf - -C $OUT_DIR_INSTALL --strip-components=1
fi

if [ -z "${URL##*.zip}" ]; then
  mkdir -p $OUT_DIR_INSTALL/tmp
  curl -s -L -o $OUT_DIR_INSTALL/tmp/nodejs.zip --url $URL
  unzip -qq $OUT_DIR_INSTALL/tmp/nodejs.zip -d $OUT_DIR_INSTALL/tmp
  mv $OUT_DIR_INSTALL/tmp/node-* $OUT_DIR_INSTALL/tmp/node
  mv $OUT_DIR_INSTALL/tmp/node/* $OUT_DIR_INSTALL
  rm -rf $OUT_DIR_INSTALL/tmp
fi

