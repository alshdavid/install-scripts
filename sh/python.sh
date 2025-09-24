#!/bin/sh
set -e

SCRIPT_DIR=`dirname $0 | while read a; do cd $a && pwd && break; done`

# Detect Nodejs Version
VERSION="PYTHON_VERSION"
