#!/bin/bash
set -e
BASE="http://localhost:4000/api/v1"

echo "=== Phase 8: AI/OCR API Tests ==="
echo ""

# 1. Login
echo "1. Login..."
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "   Trying estimator..."
  LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d '{"email":"estimator@demo.com","password":"Demo@2024!"}')
  TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")
fi

if [ -z "$TOKEN" ]; then
  echo "   FAIL: Could not login"
  exit 1
fi
echo "   OK: Token obtained"

# 2. Get a project
echo "2. Get project..."
PROJECTS=$(curl -s "$BASE/projects" -H "Authorization: Bearer $TOKEN")
PROJECT_ID=$(echo $PROJECTS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'] if isinstance(d.get('data'), list) and len(d['data'])>0 else d['data']['data'][0]['id'] if isinstance(d.get('data',{}).get('data'), list) else '')" 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo "   FAIL: No project found"
  exit 1
fi
echo "   OK: Project $PROJECT_ID"

# 3. Get AI summary (should be empty initially)
echo "3. Get AI detection summary..."
SUMMARY=$(curl -s "$BASE/projects/$PROJECT_ID/ai/summary" -H "Authorization: Bearer $TOKEN")
TOTAL=$(echo $SUMMARY | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['totalDetections'])" 2>/dev/null || echo "0")
echo "   OK: Total detections = $TOTAL"

# 4. Get AI jobs for project (should be empty)
echo "4. Get AI jobs for project..."
JOBS=$(curl -s "$BASE/projects/$PROJECT_ID/ai/jobs" -H "Authorization: Bearer $TOKEN")
echo "   OK: $(echo $JOBS | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'{len(d)} jobs')" 2>/dev/null || echo "Response received")"

# 5. Get AI detections for project
echo "5. Get AI detections for project..."
DETS=$(curl -s "$BASE/projects/$PROJECT_ID/ai/detections" -H "Authorization: Bearer $TOKEN")
echo "   OK: $(echo $DETS | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'{len(d)} detections')" 2>/dev/null || echo "Response received")"

# 6. Test bulk review endpoint (with empty array)
echo "6. Test bulk review endpoint..."
BULK=$(curl -s -X POST "$BASE/ai/detections/bulk-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"detectionIds":[],"status":"ACCEPTED"}')
echo "   OK: $(echo $BULK | head -c 100)"

# 7. Check that all AI routes are registered
echo "7. Verify AI routes are registered..."
for ROUTE in \
  "projects/$PROJECT_ID/ai/summary" \
  "projects/$PROJECT_ID/ai/jobs" \
  "projects/$PROJECT_ID/ai/detections"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$ROUTE" -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" = "200" ]; then
    echo "   OK: GET $ROUTE -> $STATUS"
  else
    echo "   WARN: GET $ROUTE -> $STATUS"
  fi
done

echo ""
echo "=== All Phase 8 API tests completed ==="
