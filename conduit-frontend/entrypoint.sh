#!/bin/sh
set -e

# Start http-server
cd /app/dist
exec http-server -p 4173 -a 0.0.0.0 --cors
