#!/bin/bash
# Test Database Connection Script

set -e

echo "🗄️  Testing Database Connection"
echo "==============================="
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✅ Loaded .env file"
else
  echo "❌ .env file not found! Run ./scripts/setup-env.sh first"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env"
  exit 1
fi

echo "Testing connection to: $DB_NAME"
echo ""

# Try to connect using psql
echo "Attempting to connect..."
echo ""

if command -v psql &> /dev/null; then
  # Test with psql
  echo "SELECT 1 as connection_test;" | psql "$DATABASE_URL" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    echo ""

    # Get database info
    echo "Database Information:"
    echo "--------------------"
    psql "$DATABASE_URL" -c "\l $DB_NAME" 2>/dev/null || echo "Database: $DB_NAME"
    echo ""

    # Check if tables exist
    echo "Checking for application tables..."
    table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

    if [ "$table_count" -gt 0 ]; then
      echo "✅ Found $table_count tables"
      echo ""
      echo "Tables:"
      psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "  (Run db-init to create schema)"
    else
      echo "⚠️  No tables found. Database schema not initialized."
      echo "   The schema will be created automatically on first server start."
    fi
  else
    echo "❌ Failed to connect to database"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify Cloud SQL instance is running"
    echo "2. Check if Cloud SQL Proxy is running:"
    echo "   cloud-sql-proxy $CLOUD_SQL_CONNECTION_NAME"
    echo "3. Verify database credentials"
    echo "4. Check firewall rules"
    exit 1
  fi
else
  echo "⚠️  psql command not found. Installing PostgreSQL client tools:"
  echo ""
  echo "macOS:"
  echo "  brew install postgresql"
  echo ""
  echo "Ubuntu/Debian:"
  echo "  sudo apt-get install postgresql-client"
  echo ""
  echo "For now, testing with Node.js..."
  echo ""

  # Test with Node.js
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    pool.query('SELECT 1 as test')
      .then(() => {
        console.log('✅ Database connection successful!');
        pool.end();
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Connection failed:', err.message);
        pool.end();
        process.exit(1);
      });
  "
fi

echo ""
echo "Connection test complete!"
