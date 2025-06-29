#!/bin/sh

rm -rf versions 
mkdir versions

# Go
mkdir versions/go
version_go=$(curl -s https://go.dev/dl/?mode=json | jq -r '.[0].version')
echo "${version_go#go}" > versions/go/latest

# Just
mkdir versions/just
curl --silent "https://api.github.com/repos/casey/just/releases/latest" | jq -r '.tag_name' > versions/just/latest

# Nodejs
mkdir versions/nodejs
curl -sSL https://nodejs.org/download/release/ |  sed -E 's/<a.*>(v.*\..*\.[0-9]+\/)<\/a>.*/\1/g' |  grep "^v" | sed -E "s/v(.*)\//\1/g" | sort -u -k 1,1n -k 2,2n -k 3,3n -t . | grep "^22" | tail -n1 > versions/nodejs/22
curl -sSL https://nodejs.org/download/release/ |  sed -E 's/<a.*>(v.*\..*\.[0-9]+\/)<\/a>.*/\1/g' |  grep "^v" | sed -E "s/v(.*)\//\1/g" | sort -u -k 1,1n -k 2,2n -k 3,3n -t . | grep "^23" | tail -n1 > versions/nodejs/23
curl -sSL https://nodejs.org/download/release/ |  sed -E 's/<a.*>(v.*\..*\.[0-9]+\/)<\/a>.*/\1/g' |  grep "^v" | sed -E "s/v(.*)\//\1/g" | sort -u -k 1,1n -k 2,2n -k 3,3n -t . | grep "^24" | tail -n1 > versions/nodejs/24
cp versions/nodejs/24 versions/nodejs/latest
cp versions/nodejs/22 versions/nodejs/current

# Procmon
mkdir versions/procmon
curl --silent "https://api.github.com/repos/alshdavid/procmon/releases/latest" | jq -r '.tag_name' > versions/procmon/latest

# Procmon
mkdir versions/rrm
curl --silent "https://api.github.com/repos/alshdavid/rrm/releases/latest" | jq -r '.tag_name' > versions/rrm/latest

# uutils
mkdir versions/uutils
curl --silent "https://api.github.com/repos/uutils/coreutils/releases/latest" | jq -r '.tag_name' > versions/uutils/latest
