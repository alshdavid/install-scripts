#!/bin/sh

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`
ROOT_DIR=$(dirname $SCRIPT_DIR)

html=""
html="${html}<link rel="stylesheet" href="style.css">\n"
html="${html}<h1># Shell Scripts #</h1>\n"

html="${html}<h2>🐥🍎 Unix</h2>\n"

for f in $ROOT_DIR/sh/*; do
  part=""
  part="${part}<article>\n"
  part="${part}<h3>$(basename $f)</h3>\n"
  part="${part}<code>\n"
  part="${part}eval $(curl -sSf \"sh.davidalsh.com/$(basename $f)\" | sh)\n"
  part="${part}</code>\n"
  part="${part}</article>\n"


  html="$html\n$part"
done

html="${html}<h2>🟦 Windows</h2>\n"

for f in $ROOT_DIR/ps1/*; do
  part=""
  part="${part}<article>\n"
  part="${part}<h3>$(basename $f)</h3>\n"
  part="${part}<code>\n"
  part="${part}iex ((New-Object System.Net.WebClient).DownloadString('sh.davidalsh.com/$(basename $f)'))\n"
  part="${part}</code>\n"
  part="${part}</article>\n"

  html="$html\n$part"
done

echo $html > index.html