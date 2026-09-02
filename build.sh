#!/usr/bin/env bash
set -e

echo "=== [1/2] Building Next.js Frontend Static Export ==="
cd client
npm install
npm run build
cd ..

echo "=== [2/2] Installing Server Dependencies ==="
cd server
pip install -r requirements.txt
cd ..

echo "=== Build Complete! Static frontend in client/out ready ==="
