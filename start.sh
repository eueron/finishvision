#!/bin/sh

echo "Current working directory: $(pwd)"
echo "Listing all files for debugging:"
find . -maxdepth 4 -name "schema.prisma"
find . -maxdepth 4 -name "main.js"

# Find the schema path
SCHEMA_PATH=$(find . -name "schema.prisma" | head -n 1)
# Find the main.js path
MAIN_PATH=$(find . -name "main.js" | grep "dist/main.js" | head -n 1)

echo "Found SCHEMA_PATH: $SCHEMA_PATH"
echo "Found MAIN_PATH: $MAIN_PATH"

if [ -z "$SCHEMA_PATH" ]; then
  echo "Error: schema.prisma not found"
  exit 1
fi

if [ -z "$MAIN_PATH" ]; then
  echo "Error: main.js not found"
  exit 1
fi

echo "Running migrations..."
npx prisma migrate deploy --schema "$SCHEMA_PATH"

echo "Starting application..."
node "$MAIN_PATH"
