#!/bin/bash
set -e

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

export OS_ARCH="${OS}-${ARCH}"

>&2 echo "$OS_ARCH"
echo "export OS_ARCH=\"${OS_ARCH}\""

if ! [ "$GITHUB_ENV" = "" ]; then
  echo "OS_ARCH=${OS_ARCH}" >> $GITHUB_ENV
fi
