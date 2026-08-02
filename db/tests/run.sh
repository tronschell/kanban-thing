#!/usr/bin/env bash
# Replays the migrations into a throwaway Postgres container, proves the view-link write bypass
# exists on db/00..20, then proves db/21 closes it. Nothing here touches a hosted database.
#
#   bash db/tests/run.sh
set -euo pipefail

container=kanban-viewtest
here="$(cd "$(dirname "$0")" && pwd)"
db="$here/.."

psql_file() {
  docker exec -i "$container" psql -q -v ON_ERROR_STOP=1 -U postgres -d postgres < "$1"
}

docker rm -f "$container" >/dev/null 2>&1 || true
docker run --rm -d --name "$container" -e POSTGRES_PASSWORD=x postgres:16 >/dev/null
for _ in $(seq 1 60); do
  docker exec "$container" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT

psql_file "$here/00_base_schema.sql"

for migration in 00_boards_expires_at 01_cascade_deletes; do
  psql_file "$db/$migration.sql"
done

# 02's guard reads cron.job, which only parses where pg_cron is installed. The rest of the file is
# superseded anyway: 04 drops delete_board_cascade and 20 redefines cleanup_expired_boards.
docker exec -i "$container" psql -q -U postgres -d postgres < "$db/02_board_deletion.sql" >/dev/null 2>&1 || true

# Skipped: 05 and 07 are rollbacks of 04 and 06; 09 needs the pg_cron extension.
for migration in 04_board_auth 06_board_reads 08_expiry_grace_period 10_view_links \
                 12_board_duplicate 13_board_brief 20_stats_triggers; do
  psql_file "$db/$migration.sql" >/dev/null
done

echo "=============== BEFORE db/21: the bypass ==============="
psql_file "$here/21_view_token_before.sql"

psql_file "$db/21_view_token_only_reads.sql"

echo
echo "=============== AFTER db/21: the bypass is closed ==============="
psql_file "$here/21_view_token.sql"
