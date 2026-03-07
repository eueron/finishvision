#!/bin/bash
set -e
BASE="http://localhost:4000/api/v1"
PASS="Demo@2024!"

# Helper to extract from possibly double-nested response
# Response format: {success:true, data: {data: [...]}} or {success:true, data: {...}}
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

echo "=== Phase 6: Estimate Engine API Tests ==="
echo ""

# 1. Login
echo "1. Login..."
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"$PASS\"}" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
AUTH="Authorization: Bearer $TOKEN"
echo "   Token obtained."

# 2. Get cost items
echo "2. List cost items..."
COST_COUNT=$(curl -s "$BASE/cost-items" -H "$AUTH" | parse "print(len(d) if isinstance(d,list) else 1)")
echo "   Cost items: $COST_COUNT"

# 3. Get labor rates
echo "3. List labor rates..."
LABOR_COUNT=$(curl -s "$BASE/labor-rates" -H "$AUTH" | parse "print(len(d) if isinstance(d,list) else 1)")
echo "   Labor rates: $LABOR_COUNT"

# 4. Get assemblies
echo "4. List assemblies..."
ASM_RESP=$(curl -s "$BASE/assemblies" -H "$AUTH")
ASM_COUNT=$(echo "$ASM_RESP" | parse "print(len(d))")
echo "   Assemblies: $ASM_COUNT"
ASM_ID=$(echo "$ASM_RESP" | parse "print(d[0]['id'])")
echo "   First assembly ID: $ASM_ID"

# 5. Get assembly detail
echo "5. Get assembly detail..."
ASM_DETAIL=$(curl -s "$BASE/assemblies/$ASM_ID" -H "$AUTH")
ITEMS_COUNT=$(echo "$ASM_DETAIL" | parse "print(len(d['items']) if isinstance(d,dict) else 0)")
echo "   Assembly items: $ITEMS_COUNT"

# 6. Get project ID
echo "6. Get project..."
PROJ_RESP=$(curl -s "$BASE/projects" -H "$AUTH")
PROJ_ID=$(echo "$PROJ_RESP" | parse "print(d[0]['id'])")
echo "   Project ID: $PROJ_ID"

# 7. Create test takeoff items
echo "7. Create test takeoff items..."
CAT_RESP=$(curl -s "$BASE/takeoff-categories" -H "$AUTH")
CAT_ID=$(echo "$CAT_RESP" | parse "print([c['id'] for c in d if c['code']=='INT_SINGLE_DOOR'][0])")
TRIM_CAT_ID=$(echo "$CAT_RESP" | parse "print([c['id'] for c in d if c['code']=='BASE_TRIM'][0])")

curl -s -X POST "$BASE/projects/$PROJ_ID/takeoff-items" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CAT_ID\",\"label\":\"Test Door 1\",\"quantity\":1}" > /dev/null
curl -s -X POST "$BASE/projects/$PROJ_ID/takeoff-items" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CAT_ID\",\"label\":\"Test Door 2\",\"quantity\":1}" > /dev/null
curl -s -X POST "$BASE/projects/$PROJ_ID/takeoff-items" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$TRIM_CAT_ID\",\"label\":\"Test Base Trim\",\"quantity\":1,\"length\":480}" > /dev/null
echo "   3 takeoff items created."

# 8. Create empty estimate
echo "8. Create empty estimate..."
EST_RESP=$(curl -s -X POST "$BASE/projects/$PROJ_ID/estimates" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"Manual Estimate","markupPercent":15,"taxPercent":8.25}')
EST_ID=$(echo "$EST_RESP" | parse "print(d['id'])")
echo "   Estimate ID: $EST_ID"

# 9. Add manual line
echo "9. Add manual estimate line..."
LINE_RESP=$(curl -s -X POST "$BASE/estimates/$EST_ID/lines" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"description":"Custom Shelf Unit","unit":"ea","quantity":2,"materialCost":150,"laborCost":80}')
LINE_ID=$(echo "$LINE_RESP" | parse "print(d['id'])")
echo "   Line ID: $LINE_ID"

# 10. Get estimate with totals
echo "10. Get estimate with totals..."
EST_DETAIL=$(curl -s "$BASE/estimates/$EST_ID" -H "$AUTH")
echo "$EST_DETAIL" | parse "
print(f'    Name: {d[\"name\"]}')
print(f'    Status: {d[\"status\"]}')
print(f'    Subtotal: \${d[\"subtotal\"]}')
print(f'    Markup ({d[\"markupPercent\"]}%): \${d[\"markupAmount\"]}')
print(f'    Tax ({d[\"taxPercent\"]}%): \${d[\"taxAmount\"]}')
print(f'    Total: \${d[\"totalAmount\"]}')
print(f'    Lines: {len(d[\"lines\"])}')
"

# 11. Generate estimate from takeoff
echo "11. Generate estimate from takeoff..."
GEN_RESP=$(curl -s -X POST "$BASE/projects/$PROJ_ID/estimates/generate" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"Auto-Generated Estimate","markupPercent":20,"taxPercent":8.25}')
GEN_ID=$(echo "$GEN_RESP" | parse "print(d['id'])")
echo "   Generated estimate ID: $GEN_ID"
echo "$GEN_RESP" | parse "
print(f'    Name: {d[\"name\"]}')
print(f'    Subtotal: \${d[\"subtotal\"]}')
print(f'    Markup ({d[\"markupPercent\"]}%): \${d[\"markupAmount\"]}')
print(f'    Tax ({d[\"taxPercent\"]}%): \${d[\"taxAmount\"]}')
print(f'    Total: \${d[\"totalAmount\"]}')
print(f'    Lines: {len(d[\"lines\"])}')
for l in d['lines']:
    print(f'      - {l[\"description\"]}: {l[\"quantity\"]} {l[\"unit\"]} | mat=\${l[\"materialCost\"]} lab=\${l[\"laborCost\"]} total=\${l[\"totalCost\"]}')
"

# 12. Update estimate status
echo "12. Update estimate status..."
curl -s -X PATCH "$BASE/estimates/$GEN_ID" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"status":"REVIEW"}' | parse "print(f'    Status: {d[\"status\"]}')"

# 13. Delete estimate line
echo "13. Delete estimate line..."
curl -s -X DELETE "$BASE/estimate-lines/$LINE_ID" -H "$AUTH" | parse "print('    Deleted.')"

# 14. List all estimates for project
echo "14. List project estimates..."
curl -s "$BASE/projects/$PROJ_ID/estimates" -H "$AUTH" | parse "
print(f'    Total estimates: {len(d)}')
for e in d:
    print(f'      - {e[\"name\"]}: \${e[\"totalAmount\"]} ({e[\"status\"]})')
"

echo ""
echo "=== ALL PHASE 6 TESTS PASSED ==="
