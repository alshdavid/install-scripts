#!/bin/bash
set -e

NAME="rrm"

# Default to current latest
VERSION="$RRM_VERSION"
if [ "$VERSION" = "" ]; then
  VERSION=$(curl --silent "https://api.github.com/repos/alshdavid/rrm/releases/latest" | jq -r '.tag_name')
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

eval $(curl -sSf "sh.davidalsh.com/which-platform.sh" | sh)

URL=""
case "$OS_ARCH" in
  linux-amd64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-linux-amd64.tar.gz";;
  linux-arm64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-linux-arm64.tar.gz";;
  macos-amd64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-macos-amd64.tar.gz";;
  macos-arm64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-macos-arm64.tar.gz";;
  windows-amd64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-windows-amd64.tar.gz";;
  windows-arm64) URL="https://github.com/alshdavid/rrm/releases/download/${VERSION}/rrm-windows-arm64.tar.gz";;
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
  chmod +x $OUT_DIR/rrm
fi

echo "export PATH=\"${OUT_DIR}:\$PATH\""

if [ "$GITHUB_PATH" != "" ]; then
  echo "${OUT_DIR}" >> $GITHUB_PATH
fi
