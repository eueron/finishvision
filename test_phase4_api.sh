#!/bin/bash
set -e

BASE="http://localhost:4000/api/v1"

echo "=== Login ==="
LOGIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token: ${TOKEN:0:20}..."

echo "=== Get Blueprint ID ==="
BP_ID=$(curl -s "$BASE/projects/00000000-0000-0000-0000-000000000010/blueprints" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Blueprint: $BP_ID"

echo "=== Get Sheet ID ==="
SHEET_ID=$(curl -s "$BASE/sheets/blueprint/$BP_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Sheet: $SHEET_ID"

echo ""
echo "=== 1. Create Calibration Annotation ==="
CALIB=$(curl -s -X POST "$BASE/sheets/$SHEET_ID/annotations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"CALIBRATION","label":"10 ft = 200 px","data":{"points":[{"x":100,"y":100},{"x":300,"y":100}],"pixelDistance":200,"knownLength":10,"unit":"ft","scaleFactor":0.6,"scaleText":"10 ft = 200 px"},"color":"#10B981"}')
echo "$CALIB" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'ID: {d[\"id\"]}, Type: {d[\"type\"]}, Label: {d[\"label\"]}')"

echo ""
echo "=== 2. Create Measurement Annotation ==="
MEAS=$(curl -s -X POST "$BASE/sheets/$SHEET_ID/annotations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"MEASUREMENT","label":"12ft-6in","data":{"points":[{"x":50,"y":200},{"x":250,"y":200}],"pixelDistance":200,"realDistance":150},"color":"#2563EB"}')
echo "$MEAS" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'ID: {d[\"id\"]}, Type: {d[\"type\"]}, Label: {d[\"label\"]}')"
MEAS_ID=$(echo "$MEAS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

echo ""
echo "=== 3. List Annotations ==="
curl -s "$BASE/sheets/$SHEET_ID/annotations" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total annotations: {len(d)}')
for a in d:
    print(f'  {a[\"type\"]}: {a[\"label\"]} ({a[\"color\"]})')
"

echo ""
echo "=== 4. Update Annotation ==="
curl -s -X PATCH "$BASE/annotations/$MEAS_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"12ft-8in","color":"#EF4444"}' | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Updated: {d[\"label\"]} ({d[\"color\"]})')"

echo ""
echo "=== 5. Delete Annotation ==="
curl -s -X DELETE "$BASE/annotations/$MEAS_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Deleted: {d[\"id\"]}')"

echo ""
echo "=== 6. Verify Sheet Scale Updated ==="
curl -s "$BASE/sheets/$SHEET_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Scale: {d[\"scaleText\"]} (factor: {d[\"scaleFactor\"]})')"

echo ""
echo "=== ALL PHASE 4 API TESTS PASSED ==="
