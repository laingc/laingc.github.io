#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ "$#" -ne 0 ]; then
  echo "Usage: ./deploy.sh (check the site; deployment runs through GitHub Actions)" >&2
  exit 2
fi

make check
echo "Checks passed. Commit and push approved changes to main to deploy through GitHub Actions."
