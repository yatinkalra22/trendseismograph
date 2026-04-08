#!/usr/bin/env bash
set -eo pipefail

echo "=== Environment Variable & Connection Checker ==="

# 1. Load .env
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found. Run ./scripts/setup.sh first."
  exit 1
fi

# Function to extract value from .env
get_env_val() {
  grep "^$1=" .env | cut -d '=' -f2- | tr -d '\r'
}

# Extract needed values
DB_URL=$(get_env_val "DATABASE_URL")
REDIS_URL=$(get_env_val "REDIS_URL")
REDIS_PASS=$(get_env_val "REDIS_PASSWORD")
REDDIT_ID=$(get_env_val "REDDIT_CLIENT_ID")
REDDIT_SECRET=$(get_env_val "REDDIT_CLIENT_SECRET")
RESEND_KEY=$(get_env_val "RESEND_API_KEY")

echo "--- Configuration Check ---"

# Check for placeholder values
check_placeholder() {
  local val=$1
  local name=$2
  if [[ "$val" == *"your_"* ]] || [[ "$val" == *"change-me"* ]] || [[ -z "$val" ]]; then
    echo "⚠️  $name: NOT CONFIGURED (still uses placeholder or is empty)"
    return 1
  else
    echo "✅ $name: Configured"
    return 0
  fi
}

check_placeholder "$REDDIT_ID" "Reddit Client ID"
check_placeholder "$REDDIT_SECRET" "Reddit Client Secret"
check_placeholder "$RESEND_KEY" "Resend API Key"

echo ""
echo "--- Connection Check ---"

# 2. Test PostgreSQL
echo "Testing PostgreSQL connection..."
if [[ "$DB_URL" == *"localhost"* ]] || [[ "$DB_URL" == *"127.0.0.1"* ]] || [[ "$DB_URL" == *"postgres:"* ]]; then
  # Extract host, port, db, user, pass from URL if possible for pg_isready
  # Simplest way: try to use the URL directly with psql (if installed) or just check if Docker is up
  if command -v psql >/dev/null 2>&1; then
    if psql "$DB_URL" -c '\q' >/dev/null 2>&1; then
      echo "✅ PostgreSQL: Connected successfully"
    else
      echo "❌ PostgreSQL: Connection failed (check if Docker is running and password is correct)"
    fi
  else
    echo "ℹ️  PostgreSQL: skipping psql test (psql not installed on host)"
  fi
fi

# 3. Test Redis
echo "Testing Redis connection..."
if command -v redis-cli >/dev/null 2>&1; then
    # Parse redis URL for host and port
    # redis://[:password]@host:port
    REDIS_HOST=$(echo "$REDIS_URL" | sed -e 's|.*@||' -e 's|:.*||')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -e 's|.*:||')
    
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASS" ping >/dev/null 2>&1; then
      echo "✅ Redis: Connected successfully"
    else
      echo "❌ Redis: Connection failed (check if Docker is running and password is correct)"
    fi
else
    echo "ℹ️  Redis: skipping redis-cli test (redis-cli not installed on host)"
fi

echo ""
echo "Note: If Postgres/Redis tests skipped or failed, ensure you have run 'docker compose up -d' first."
echo "=== Check complete ==="
