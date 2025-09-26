#!/usr/bin/sh
set -e

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`

OUT_DIR="$OUT_DIR"
if [ "$OUT_DIR" = "" ]; then
  OUT_DIR="$HOME/.local/rust"
fi

# Find rust-toolchain
RUST_TOOLCHAIN=""
if [ "$RUST_TOOLCHAIN" = "" ]; then 
  CUR="$SCRIPT_DIR"
  while true; do
    if [ -f "$CUR/rust-toolchain" ]; then
      RUST_TOOLCHAIN="$(cat "$CUR/rust-toolchain")"
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

>&2 echo OUT_DIR: $OUT_DIR

export RUSTUP_HOME="${OUT_DIR}/rustup"
export CARGO_HOME="${OUT_DIR}/rust/cargo"
export RUST_BIN="${CARGO_HOME}/bin"

>&2 echo RUSTUP_HOME: $RUSTUP_HOME
>&2 echo CARGO_HOME: $CARGO_HOME
>&2 echo RUST_BIN: $RUST_BIN
>&2 echo

export PATH="${RUST_BIN}:$PATH"

echo "export PATH=\"${RUST_BIN}:\$PATH\""
echo "export RUSTUP_HOME=\"${RUSTUP_HOME}\""
echo "export CARGO_HOME=\"${CARGO_HOME}\""
echo "export RUST_BIN=\"${RUST_BIN}\""

if ! [ "$GITHUB_ENV" = "" ]; then
  echo "RUSTUP_HOME=${RUSTUP_HOME}" >> $GITHUB_ENV
  echo "CARGO_HOME=${CARGO_HOME}" >> $GITHUB_ENV
fi

if ! [ "$GITHUB_PATH" = "" ]; then
  echo "${RUST_BIN}" >> $GITHUB_PATH
fi

rm -rf $OUT_DIR
mkdir -p $OUT_DIR

if [ "$RUST_TOOLCHAIN" = "" ]; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --no-modify-path -y 1>&2
else 
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --no-modify-path  --default-toolchain $RUST_TOOLCHAIN -y 1>&2
fi
