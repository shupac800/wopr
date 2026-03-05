#!/bin/bash
set -e

KEY="$HOME/.ssh/lightsail-utility-host"
HOST="bitnami@16.58.23.107"
REMOTE_DIR="/home/bitnami/wopr/"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

scp -r -i "$KEY" \
  "$SCRIPT_DIR/css" \
  "$SCRIPT_DIR/data" \
  "$SCRIPT_DIR/js" \
  "$SCRIPT_DIR/index.html" \
  "$HOST:$REMOTE_DIR"

echo "Deployed to $HOST:$REMOTE_DIR"
