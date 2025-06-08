#!/bin/bash
set -e

# Default to current latest
VERSION="$JUST_VERSION"
if [ "$VERSION" = "" ]; then
  VERSION=$(curl --silent "https://api.github.com/repos/casey/just/releases/latest" | jq -r '.tag_name')
fi

if [ "$VERSION" = "" ]; then
  echo "Unable to fetch version"
  exit 1
fi

# Default to home directory
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/just"
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
  linux-amd64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-x86_64-unknown-linux-musl.tar.gz";;
  linux-arm64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-aarch64-unknown-linux-musl.tar.gz";;
  macos-amd64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-x86_64-apple-darwin.tar.gz";;
  macos-arm64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-aarch64-apple-darwin.tar.gz";;
  windows-amd64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-x86_64-pc-windows-msvc.zip";;
  windows-arm64) URL="https://github.com/casey/just/releases/download/${VERSION}/just-${VERSION}-aarch64-pc-windows-msvc.zip";;
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
fi

if [ -z "${URL##*.zip}" ]; then
  curl -s -L -o $OUT_DIR/just.zip --url $URL
  unzip -qq $OUT_DIR/just.zip -d $OUT_DIR
  rm -rf $OUT_DIR/just.zip
fi

echo "export PATH=\"${OUT_DIR}:\$PATH\""

if [ "$GITHUB_PATH" != "" ]; then
  echo "${OUT_DIR}" >> $GITHUB_PATH
fi
