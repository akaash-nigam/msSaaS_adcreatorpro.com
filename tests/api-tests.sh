#!/bin/bash
# API Endpoint Testing Script

set -e

echo "🧪 AdCreatorPro API Testing"
echo "============================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${FIREBASE_ID_TOKEN:-}"

echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local auth_required=$6

  TESTS_RUN=$((TESTS_RUN + 1))

  echo "Test $TESTS_RUN: $name"
  echo "  Method: $method"
  echo "  Endpoint: $endpoint"

  headers="-H 'Content-Type: application/json'"
  if [ "$auth_required" = "true" ] && [ -n "$TOKEN" ]; then
    headers="$headers -H 'Authorization: Bearer $TOKEN'"
  fi

  if [ -n "$data" ]; then
    response=$(eval curl -s -w "\\n%{http_code}" -X $method "$API_URL$endpoint" $headers -d '$data')
  else
    response=$(eval curl -s -w "\\n%{http_code}" -X $method "$API_URL$endpoint" $headers)
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✅ PASSED${NC} (Status: $status_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "  ${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
    echo "  Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
}

echo "======================================"
echo "Public Endpoints (No Auth Required)"
echo "======================================"
echo ""

test_endpoint \
  "Health Check" \
  "GET" \
  "/api/health" \
  "" \
  "200" \
  "false"

test_endpoint \
  "Get Templates" \
  "GET" \
  "/api/templates" \
  "" \
  "200" \
  "false"

test_endpoint \
  "Generate Ad (Guest - No Auth)" \
  "POST" \
  "/api/generate-ad" \
  '{"product":"Test product","platform":"Facebook/Instagram","tone":"Professional","variationsCount":1}' \
  "200" \
  "false"

echo "======================================"
echo "Protected Endpoints (Auth Required)"
echo "======================================"
echo ""

if [ -z "$TOKEN" ]; then
  echo -e "${RED}⚠️  FIREBASE_ID_TOKEN not set. Skipping auth tests.${NC}"
  echo "To test authenticated endpoints:"
  echo "  1. Get a Firebase ID token from your app"
  echo "  2. export FIREBASE_ID_TOKEN='your-token-here'"
  echo "  3. Re-run this script"
  echo ""
else
  test_endpoint \
    "Get User Profile" \
    "GET" \
    "/api/user/profile" \
    "" \
    "200" \
    "true"

  test_endpoint \
    "Get Ad History" \
    "GET" \
    "/api/user/ads" \
    "" \
    "200" \
    "true"

  test_endpoint \
    "Create Brand Profile" \
    "POST" \
    "/api/brand-profiles" \
    '{"name":"Test Brand","industry":"Tech","brandVoice":"Professional"}' \
    "201" \
    "true"

  test_endpoint \
    "List Brand Profiles" \
    "GET" \
    "/api/brand-profiles" \
    "" \
    "200" \
    "true"

  test_endpoint \
    "Generate Ad (Authenticated)" \
    "POST" \
    "/api/generate-ad" \
    '{"product":"Premium coffee","platform":"Instagram","variationsCount":2}' \
    "200" \
    "true"

  test_endpoint \
    "Create Checkout Session" \
    "POST" \
    "/api/stripe/create-checkout-session" \
    '{"tier":"starter"}' \
    "200" \
    "true"
fi

echo "======================================"
echo "Error Handling Tests"
echo "======================================"
echo ""

test_endpoint \
  "Generate Ad - Missing Product" \
  "POST" \
  "/api/generate-ad" \
  '{"platform":"Facebook","tone":"Professional"}' \
  "400" \
  "false"

test_endpoint \
  "Invalid Endpoint" \
  "GET" \
  "/api/invalid-endpoint" \
  "" \
  "404" \
  "false"

echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "Total Tests: $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
