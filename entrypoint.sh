#!/bin/sh

# Exit on error for all commands except the initial migrate deploy attempt
set +e

echo "Running production migrations..."
OUTPUT=$(npx prisma migrate deploy 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Migrations applied successfully"
else
    echo "$OUTPUT"
    
    # Check if it's the P3005 baseline error
    if echo "$OUTPUT" | grep -q "P3005"; then
        echo "⚠️  Database needs baselining. Marking existing migrations as applied..."
        
        # Get list of all migrations
        MIGRATIONS=$(ls -1 prisma/migrations | grep -E '^[0-9]' | sort)
        
        # Mark each migration as applied (except the last one which we'll actually run)
        for migration in $MIGRATIONS; do
            echo "  → Marking $migration as applied..."
            npx prisma migrate resolve --applied "$migration" || true
        done
        
        echo "🔄 Attempting to apply remaining migrations..."
        npx prisma migrate deploy
        
        if [ $? -eq 0 ]; then
            echo "✅ Migrations applied successfully after baseline"
        else
            echo "❌ Migration failed even after baselining"
            exit 1
        fi
    else
        echo "❌ Migration failed with unexpected error"
        exit 1
    fi
fi

set -e
echo "Starting application..."
exec "$@"
