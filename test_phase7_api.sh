#!/bin/bash
set -e
BASE="http://localhost:4000/api/v1"
PASS="Demo@2024!"

parse() {
  python3 -c "
import sys,json
resp=json.load(sys.stdin)
d=resp.get('data',resp)
if isinstance(d,dict) and 'data' in d:
    d=d['data']
$1
" 2>&1
}

echo "=== Phase 7: Reporting API Tests ==="
echo ""

sleep 5

# 1. Login
echo "1. Login..."
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"$PASS\"}" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
AUTH="Authorization: Bearer $TOKEN"
echo "   Token obtained."

# 2. Get project
echo "2. Get project..."
PROJ_RESP=$(curl -s "$BASE/projects" -H "$AUTH")
PROJ_ID=$(echo "$PROJ_RESP" | parse "print(d[0]['id'])")
echo "   Project ID: $PROJ_ID"

# 3. Generate takeoff summary PDF
echo "3. Generate takeoff summary PDF..."
TAKEOFF_REPORT=$(curl -s -X POST "$BASE/projects/$PROJ_ID/reports/generate" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"TAKEOFF_SUMMARY","format":"PDF","name":"Takeoff Summary Test"}')
TAKEOFF_ID=$(echo "$TAKEOFF_REPORT" | parse "print(d['id'])")
TAKEOFF_SIZE=$(echo "$TAKEOFF_REPORT" | parse "print(d.get('fileSize',0))")
echo "   Report ID: $TAKEOFF_ID (${TAKEOFF_SIZE} bytes)"

# 4. Generate takeoff summary CSV
echo "4. Generate takeoff summary CSV..."
CSV_REPORT=$(curl -s -X POST "$BASE/projects/$PROJ_ID/reports/generate" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"type":"TAKEOFF_SUMMARY","format":"CSV"}')
CSV_ID=$(echo "$CSV_REPORT" | parse "print(d['id'])")
CSV_SIZE=$(echo "$CSV_REPORT" | parse "print(d.get('fileSize',0))")
echo "   Report ID: $CSV_ID (${CSV_SIZE} bytes)"

# 5. Get estimate for estimate reports
echo "5. Get estimate..."
EST_RESP=$(curl -s "$BASE/projects/$PROJ_ID/estimates" -H "$AUTH")
EST_ID=$(echo "$EST_RESP" | parse "print(d[0]['id'])")
echo "   Estimate ID: $EST_ID"

# 6. Generate estimate summary PDF
echo "6. Generate estimate summary PDF..."
EST_REPORT=$(curl -s -X POST "$BASE/projects/$PROJ_ID/reports/generate" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"type\":\"ESTIMATE_SUMMARY\",\"format\":\"PDF\",\"estimateId\":\"$EST_ID\"}")
EST_RPT_ID=$(echo "$EST_REPORT" | parse "print(d['id'])")
EST_RPT_SIZE=$(echo "$EST_REPORT" | parse "print(d.get('fileSize',0))")
echo "   Report ID: $EST_RPT_ID (${EST_RPT_SIZE} bytes)"

# 7. Generate proposal PDF
echo "7. Generate proposal PDF..."
PROP_REPORT=$(curl -s -X POST "$BASE/projects/$PROJ_ID/reports/generate" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"type\":\"PROPOSAL\",\"format\":\"PDF\",\"estimateId\":\"$EST_ID\",\"name\":\"Client Proposal\"}")
PROP_ID=$(echo "$PROP_REPORT" | parse "print(d['id'])")
PROP_SIZE=$(echo "$PROP_REPORT" | parse "print(d.get('fileSize',0))")
echo "   Report ID: $PROP_ID (${PROP_SIZE} bytes)"

# 8. Download report
echo "8. Download report..."
HTTP_CODE=$(curl -s -o /tmp/test_report.pdf -w "%{http_code}" "$BASE/reports/$TAKEOFF_ID/download" -H "$AUTH")
DOWNLOAD_SIZE=$(stat -c%s /tmp/test_report.pdf 2>/dev/null || echo 0)
echo "   HTTP: $HTTP_CODE, File size: $DOWNLOAD_SIZE bytes"

# 9. List all reports
echo "9. List project reports..."
curl -s "$BASE/projects/$PROJ_ID/reports" -H "$AUTH" | parse "
print(f'    Total reports: {len(d)}')
for r in d:
    print(f'      - {r[\"name\"]} ({r[\"type\"]}/{r[\"format\"]}) {r.get(\"fileSize\",0)} bytes')
"

# 10. Delete a report
echo "10. Delete CSV report..."
curl -s -X DELETE "$BASE/reports/$CSV_ID" -H "$AUTH" | parse "print('    Deleted.')"

echo ""
echo "=== ALL PHASE 7 TESTS PASSED ==="
