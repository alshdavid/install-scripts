#!/usr/bin/sh
set -e

# Default to current latest
VERSION="$GO_VERSION"
if [ "$VERSION" = "" ]; then
  VERSION=$(curl -s https://sh.davidalsh.com/versions/go/latest)
fi

# The archives are prefixed
VERSION="go$VERSION"

if [ "$VERSION" = "" ]; then
  echo "Unable to fetch version"
  exit 1
fi

# Default to home directory
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/go"
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
  linux-amd64) URL="https://go.dev/dl/$VERSION.linux-amd64.tar.gz";;
  linux-arm64) URL="https://go.dev/dl/$VERSION.linux-arm64.tar.gz";;
  macos-amd64) URL="https://go.dev/dl/$VERSION.darwin-amd64.tar.gz";;
  macos-arm64) URL="https://go.dev/dl/$VERSION.darwin-arm64.tar.gz";;
  windows-amd64) URL="https://go.dev/dl/$VERSION.windows-amd64.zip";;
  windows-arm64) URL="https://go.dev/dl/$VERSION.windows-arm64.zip";;
esac

if [ "$URL" = "" ]; then
  echo "Cannot find archive"
  exit 1
fi

>&2 echo URL: $URL
test -d $OUT_DIR && rm -rf $OUT_DIR
mkdir -p $OUT_DIR

if [ -z "${URL##*.tar.gz}" ]; then
  curl -s -L -o $OUT_DIR/go.tar.gz --url $URL
  tar -C $OUT_DIR --strip-components=1 -xzf $OUT_DIR/go.tar.gz
  rm -rf $OUT_DIR/go.tar.gz
fi

if [ -z "${URL##*.zip}" ]; then
  curl -s -L -o $OUT_DIR/go.zip --url $URL
  unzip -qq $OUT_DIR/go.zip -d $OUT_DIR
  mv $OUT_DIR/go/* $OUT_DIR
  rm -rf $OUT_DIR/go.zip
  rm -rf $OUT_DIR/go
fi

echo "export PATH=\"${OUT_DIR}/bin:\$PATH\""

if [ "$GITHUB_PATH" != "" ]; then
  echo "${OUT_DIR}/bin" >> $GITHUB_PATH
fi
