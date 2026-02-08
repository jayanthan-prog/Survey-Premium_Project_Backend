#!/usr/bin/env bash
set -euo pipefail

BASE=${1:-http://localhost:3000}
EMAIL=${2:-alice@example.com}
NAME=${3:-"Test User"}

echo "Ensuring test user exists: $EMAIL"
node scripts/create_test_user.js "$EMAIL" "$NAME" || true

echo "Requesting token for $EMAIL"
LOGIN_RESP=$(curl -sS -X POST "$BASE/api/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")

# Try jq first, fallback to node JSON parse
if command -v jq >/dev/null 2>&1; then
  TOKEN=$(echo "$LOGIN_RESP" | jq -r .token)
else
  TOKEN=$(echo "$LOGIN_RESP" | node -e "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(s);console.log(j.token||'')}catch(e){}})")
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "\nLogin failed. Response:" >&2
  echo "$LOGIN_RESP" >&2
  exit 1
fi

echo "Got token: ${TOKEN:0:8}... (truncated)"

ENDPOINTS=(
  users
  groups
  relay-stage-actions
  relay-workflows
  action-plan-items
  action-plans
  audit-events
  audit-logs
  auth-tokens
  calendar-slots
  enums
  group-members
  relay-instances
  relay-stages
  slot-bookings
  survey-answer-selections
  survey_answers
  survey_options
  survey_participants
  survey_question_options
  survey-questions
  survey-releases
  surveys
  approvals
  user-roles
  roles
  permissions
  role-permissions
  option-capacities
  option-quota-buckets
  survey-sessions
)

printf "\nTesting endpoints with token...\n\n"
for ep in "${ENDPOINTS[@]}"; do
  url="$BASE/api/$ep"
  status=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$url" || true)
  printf "%-30s %s\n" "$ep" "$status"
done

echo "\nDone. If you still see 401s, check server logs and that the token exists in the auth_tokens table (revoked_at NULL, expires_at in future)."
