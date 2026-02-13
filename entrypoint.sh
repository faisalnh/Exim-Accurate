#!/bin/sh

# Exit on error
set -e

echo "Running production migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"
