#!/bin/bash
set -e

KEY="$HOME/.ssh/lightsail-utility-host"
HOST="bitnami@16.58.23.107"
REMOTE_DIR="/home/bitnami/wopr/"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Generate cache-bust hash from current git commit (short SHA)
HASH=$(git -C "$SCRIPT_DIR" rev-parse --short HEAD 2>/dev/null || date +%s)

# Rewrite version strings in index.html before deploying
sed "s/?v=[a-zA-Z0-9]*/?v=$HASH/g" "$SCRIPT_DIR/index.html" > "$SCRIPT_DIR/index.html.tmp"
mv "$SCRIPT_DIR/index.html.tmp" "$SCRIPT_DIR/index.html"

scp -r -i "$KEY" \
  "$SCRIPT_DIR/css" \
  "$SCRIPT_DIR/data" \
  "$SCRIPT_DIR/js" \
  "$SCRIPT_DIR/index.html" \
  "$HOST:$REMOTE_DIR"

echo "Deployed to $HOST:$REMOTE_DIR (cache-bust: $HASH)"
