#!/bin/sh
set -e

KEY_FILE="/openbao/file/unseal.key"

mkdir -p /openbao/file

if [ ! -f "$KEY_FILE" ]; then
  head -c 32 /dev/urandom > "$KEY_FILE"
  chown 100:1000 "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi

exec bao server -config=/openbao/config/config.hcl
