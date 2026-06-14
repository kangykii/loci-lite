#!/bin/bash

# Script to generate a valid signature for Tauri updates
# Usage: ./sign-release.sh <path-to-exe> <private-key-path>

set -e

EXE_PATH="${1}"
PRIVATE_KEY="${2}"

if [ -z "$EXE_PATH" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "Usage: $0 <path-to-exe> <private-key-path>"
  exit 1
fi

if [ ! -f "$EXE_PATH" ]; then
  echo "Error: EXE not found at $EXE_PATH"
  exit 1
fi

if [ ! -f "$PRIVATE_KEY" ]; then
  echo "Error: Private key not found at $PRIVATE_KEY"
  exit 1
fi

# Sign the executable using OpenSSL
openssl dgst -sha256 -sign "$PRIVATE_KEY" "$EXE_PATH" | openssl base64 -A > "${EXE_PATH}.sig"

echo "Signature created: ${EXE_PATH}.sig"
cat "${EXE_PATH}.sig"
