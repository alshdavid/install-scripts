#!/bin/bash
set -e

NAME="uutils"

# Default to current latest
VERSION="$UUTILS_VERSION"
if [ "$VERSION" = "" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/$NAME/latest)
fi

if [ "$VERSION" = "" ]; then
  echo "Unable to fetch version"
  exit 1
fi

# Default to home directory
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/$NAME"
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
  MINGW64_NT* | Windows_NT) OS="windows";;
  *) OS="";;
esac

>&2 echo ARCH: $ARCH
>&2 echo OS: $OS

URL=""
case "$OS-$ARCH" in
  windows-amd64) URL="https://github.com/uutils/coreutils/releases/download/${VERSION}/coreutils-${VERSION}-x86_64-pc-windows-msvc.zip";;
  windows-arm64) URL="https://github.com/uutils/coreutils/releases/download/${VERSION}/coreutils-${VERSION}-aarch64-pc-windows-msvc.zip";;
esac

if [ "$URL" = "" ]; then
  echo "Cannot find archive"
  exit 1
fi

>&2 echo URL: $URL

test -d $OUT_DIR && rm -rf $OUT_DIR
mkdir -p $OUT_DIR

if [ -z "${URL##*.tar.gz}" ]; then
  curl -s -L --url $URL | tar -xzf - -C $OUT_DIR
  chmod +x $OUT_DIR/$NAME
fi

if [ -z "${URL##*.zip}" ]; then
  mkdir -p $OUT_DIR/tmp
  curl -s -L -o $OUT_DIR/tmp/uutils.zip --url $URL
  unzip -qq $OUT_DIR/tmp/uutils.zip -d $OUT_DIR/tmp
  mv $OUT_DIR/tmp/coreutils-* $OUT_DIR/tmp/uutils
  mv $OUT_DIR/tmp/uutils/* $OUT_DIR
  rm -rf $OUT_DIR/tmp
fi

echo "export PATH=\"${OUT_DIR}:\$PATH\""

if [ "$GITHUB_PATH" != "" ]; then
  echo "${OUT_DIR}" >> $GITHUB_PATH
fi
