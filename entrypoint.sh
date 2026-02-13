#!/bin/sh

echo "Syncing database schema..."
npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo "✅ Database schema synced successfully"
else
    echo "❌ Database schema sync failed"
    exit 1
fi

echo "Starting application..."
exec "$@"
