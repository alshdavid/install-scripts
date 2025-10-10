PATH_BIN="$OUT_DIR"

# Create env file
echo "SCRIPT_PATH=\`dirname \$0 | while read a; do cd \$a && pwd && break; done\`"  > $OUT_DIR/env
echo "echo export PATH=\"\${SCRIPT_PATH}:\\\$PATH\""                                >> $OUT_DIR/env

# Github CI
if ! [ "$GITHUB_PATH" = "" ]; then
  echo $PATH_BIN >> $GITHUB_PATH
fi
