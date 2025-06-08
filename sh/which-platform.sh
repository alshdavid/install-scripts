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

>&2 echo "$OS-$ARCH"
echo "export OS_ARCH=\"${OS}-${ARCH}\""
