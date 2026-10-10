#!/bin/bash
cd "$(dirname "$0")"
PORT=4000
URL="http://localhost:$PORT"
echo "Starting BnanBrand store..."
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it from https://nodejs.org"
  read -r -p "Press Enter to close..."
  exit 1
fi
OLD_PID=$(lsof -ti tcp:$PORT 2>/dev/null)
if [ -n "$OLD_PID" ]; then echo "$OLD_PID" | xargs kill -9 2>/dev/null; sleep 1; fi
node server/index.js &
SERVER_PID=$!
for _ in $(seq 1 20); do
  if curl -s -o /dev/null "$URL/api/health" 2>/dev/null; then break; fi
  sleep 0.5
done
echo "Store    : $URL"
echo "Admin    : $URL/admin  (Bnan1 / Bnan1234)"
open "$URL" 2>/dev/null || true
wait $SERVER_PID
