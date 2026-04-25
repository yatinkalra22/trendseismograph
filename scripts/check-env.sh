#!/usr/bin/env bash
# Connection checks run regardless of placeholder warnings, so we keep -e off
# for the configuration-check section. pipefail is still useful for piped commands.
set -o pipefail

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
YOUTUBE_KEY=$(get_env_val "YOUTUBE_API_KEY")

echo "--- Configuration Check ---"

# Returns 0 if value is set and not a placeholder, 1 otherwise.
is_configured() {
  local val=$1
  if [[ "$val" == *"your_"* ]] || [[ "$val" == *"change-me"* ]] || [[ -z "$val" ]]; then
    return 1
  fi
  return 0
}

# Active variables the running stack actually depends on.
check_required() {
  local val=$1
  local name=$2
  if is_configured "$val"; then
    echo "✅ $name: Configured"
  else
    echo "⚠️  $name: NOT CONFIGURED (still uses placeholder or is empty)"
  fi
}

# Variables that are intentionally dormant for the ZerveHack 2026 submission.
# Surfaced as informational (ℹ️) so the script no longer exits early.
check_dormant() {
  local val=$1
  local name=$2
  if is_configured "$val"; then
    echo "ℹ️  $name: Configured (legacy code path; not used by the Zerve submission)"
  else
    echo "ℹ️  $name: not set — expected. Reddit pipeline is dormant for the hackathon."
  fi
}

check_required "$RESEND_KEY" "Resend API Key"
check_required "$YOUTUBE_KEY" "YouTube API Key (active discourse signal in zerve/cells/03)"
check_dormant  "$REDDIT_ID" "Reddit Client ID"
check_dormant  "$REDDIT_SECRET" "Reddit Client Secret"

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
