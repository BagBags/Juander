#!/bin/bash
# Backup script for pins collection before cleanup
# Run this BEFORE running cleanup-pins.sh

echo "========================================="
echo "  Pins Collection Backup Script"
echo "========================================="
echo ""

# Get MongoDB connection string from .env
if [ -f "../.env" ]; then
    export $(cat ../.env | grep MONGODB_URI | xargs)
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI not found in .env file"
    echo "Please set MONGODB_URI in backend/.env"
    exit 1
fi

# Create backup directory with timestamp
BACKUP_DIR="./backups/pins-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup of pins collection..."
echo "Backup location: $BACKUP_DIR"
echo ""

# Export pins collection to JSON
mongoexport --uri="$MONGODB_URI" \
    --collection=pins \
    --out="$BACKUP_DIR/pins.json" \
    --jsonArray \
    --pretty

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup completed successfully!"
    echo "📁 Backup saved to: $BACKUP_DIR/pins.json"
    echo ""
    echo "To restore this backup, run:"
    echo "  mongoimport --uri=\"\$MONGODB_URI\" --collection=pins --file=\"$BACKUP_DIR/pins.json\" --jsonArray --drop"
else
    echo ""
    echo "❌ Backup failed!"
    exit 1
fi
