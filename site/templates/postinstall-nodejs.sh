PATH_PREFIX="${OUT_DIR}/prefix"
PATH_PREFIX_BIN="${OUT_DIR}/prefix/bin"
PATH_BIN="$OUT_DIR/bin"

if [ "$OS" = "windows" ]; then
  PATH_BIN="${OUT_DIR}"
fi

mkdir -p $OUT_DIR/prefix
mkdir -p $OUT_DIR/cache

# Create env file
echo "SCRIPT_PATH=\`dirname \$0 | while read a; do cd \$a && pwd && break; done\`"  > $OUT_DIR/env
if [ "$OS" = "windows" ]; then
echo "echo export PATH=\"\${SCRIPT_PATH}:\\\$PATH\""                                >> $OUT_DIR/env
else
echo "echo export PATH=\"\${SCRIPT_PATH}/bin:\\\$PATH\""                            >> $OUT_DIR/env
fi
echo "echo export PATH=\"\${SCRIPT_PATH}/prefix/bin:\\\$PATH\""                     >> $OUT_DIR/env
echo "echo export NPM_CONFIG_PREFIX=\"\${SCRIPT_PATH}/prefix\""                     >> $OUT_DIR/env

# Github CI
if ! [ "$GITHUB_PATH" = "" ]; then
  echo $PATH_BIN >> $GITHUB_PATH
  echo $PATH_PREFIX_BIN >> $GITHUB_PATH
fi

if ! [ "$GITHUB_ENV" = "" ]; then
  echo "NPM_CONFIG_PREFIX=${PATH_PREFIX}" >> $GITHUB_ENV
fi
