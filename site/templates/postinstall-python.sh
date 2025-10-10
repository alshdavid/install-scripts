PATH_BIN="$OUT_DIR/bin"

if [ "$OS" = "windows" ]; then
  PATH_BIN="${OUT_DIR}"
fi

# Create env file
echo "SCRIPT_PATH=\`dirname \$0 | while read a; do cd \$a && pwd && break; done\`"  > $OUT_DIR/env
if [ "$OS" = "windows" ]; then
echo "echo export PATH=\"\${SCRIPT_PATH}:\\\$PATH\""                                >> $OUT_DIR/env
else
echo "echo export PATH=\"\${SCRIPT_PATH}/bin:\\\$PATH\""                            >> $OUT_DIR/env
fi

# Github CI
if ! [ "$GITHUB_PATH" = "" ]; then
  echo $PATH_BIN >> $GITHUB_PATH
fi
