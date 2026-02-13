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
        MIGRATION_COUNT=$(echo "$MIGRATIONS" | wc -l)
        CURRENT=0
        
        # Mark all migrations EXCEPT the last one as applied
        # This assumes the last migration is the new one that needs to actually run
        for migration in $MIGRATIONS; do
            CURRENT=$((CURRENT + 1))
            
            # Skip the last migration - let it run for real
            if [ $CURRENT -eq $MIGRATION_COUNT ]; then
                echo "  ⏭️  Skipping $migration (will run as new migration)"
                continue
            fi
            
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
