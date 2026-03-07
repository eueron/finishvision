#!/bin/bash
set -e

BASE="http://localhost:4000/api/v1"

echo "=== Login ==="
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token: ${TOKEN:0:20}..."

PROJECT_ID="00000000-0000-0000-0000-000000000010"

echo ""
echo "=== 1. List Takeoff Categories ==="
CATS=$(curl -s "$BASE/takeoff-categories" -H "Authorization: Bearer $TOKEN")
echo "$CATS" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total categories: {len(d)}')
for c in d[:5]:
    print(f'  {c[\"code\"]}: {c[\"name\"]} ({c[\"measureType\"]}, {c[\"unit\"]}) color={c[\"color\"]}')
print(f'  ... and {len(d)-5} more')
"

echo ""
echo "=== 2. Create Custom Category ==="
CUSTOM_CAT=$(curl -s -X POST "$BASE/takeoff-categories" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Custom Shelf","code":"CUSTOM_SHELF","color":"#FF6B6B","measureType":"LINEAR","unit":"lf"}')
echo "$CUSTOM_CAT" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Created: {d[\"name\"]} ({d[\"code\"]})')"

echo ""
echo "=== 3. Get a Category ID for testing ==="
CAT_ID=$(echo "$CATS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Category ID: $CAT_ID"

echo ""
echo "=== 4. Create Single Takeoff Item (Count) ==="
ITEM=$(curl -s -X POST "$BASE/projects/$PROJECT_ID/takeoff-items" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CAT_ID\",\"label\":\"Master Bedroom Door\",\"quantity\":1,\"coordinates\":{\"type\":\"point\",\"points\":[{\"x\":150,\"y\":200}]}}")
echo "$ITEM" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'ID: {d[\"id\"]}, Label: {d[\"label\"]}, Qty: {d[\"quantity\"]}')"
ITEM_ID=$(echo "$ITEM" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

echo ""
echo "=== 5. Bulk Create Takeoff Items ==="
BULK=$(curl -s -X POST "$BASE/projects/$PROJECT_ID/takeoff-items/bulk" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[
    {\"categoryId\":\"$CAT_ID\",\"label\":\"Living Room Door\",\"quantity\":1,\"coordinates\":{\"type\":\"point\",\"points\":[{\"x\":300,\"y\":100}]}},
    {\"categoryId\":\"$CAT_ID\",\"label\":\"Kitchen Door\",\"quantity\":1,\"coordinates\":{\"type\":\"point\",\"points\":[{\"x\":400,\"y\":150}]}},
    {\"categoryId\":\"$CAT_ID\",\"label\":\"Bathroom Door\",\"quantity\":2,\"coordinates\":{\"type\":\"point\",\"points\":[{\"x\":500,\"y\":200}]}}
  ]}")
echo "$BULK" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Bulk created: {len(d)} items')"

echo ""
echo "=== 6. List Takeoff Items ==="
curl -s "$BASE/projects/$PROJECT_ID/takeoff-items" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total items: {len(d)}')
for i in d:
    print(f'  {i[\"label\"]}: qty={i[\"quantity\"]} ({i[\"category\"][\"name\"]})')
"

echo ""
echo "=== 7. Update Takeoff Item ==="
curl -s -X PATCH "$BASE/takeoff-items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"Master Bedroom Door (Verified)","verified":true,"notes":"Confirmed on site"}' | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Updated: {d[\"label\"]}, verified={d[\"verified\"]}')"

echo ""
echo "=== 8. Get Takeoff Summary ==="
curl -s "$BASE/projects/$PROJECT_ID/takeoff-summary" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total items: {d[\"totalItems\"]}, Verified: {d[\"totalVerified\"]}')
for c in d['categories']:
    print(f'  {c[\"categoryName\"]}: count={c[\"totalCount\"]}, qty={c[\"totalQuantity\"]}')
"

echo ""
echo "=== 9. Delete Takeoff Item ==="
curl -s -X DELETE "$BASE/takeoff-items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Deleted: {d[\"id\"]}')"

echo ""
echo "=== 10. Verify Deletion ==="
curl -s "$BASE/projects/$PROJECT_ID/takeoff-items" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Remaining items: {len(d)}')"

echo ""
echo "=== ALL PHASE 5 BACKEND TESTS PASSED ==="
