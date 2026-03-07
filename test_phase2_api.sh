#!/bin/bash
set -e

BASE="http://localhost:4000/api/v1"

echo "=== Login ==="
LOGIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token: ${TOKEN:0:20}..."

PROJECT_ID="00000000-0000-0000-0000-000000000010"

echo ""
echo "=== 1. List Buildings ==="
BUILDINGS=$(curl -s $BASE/projects/$PROJECT_ID/buildings -H "Authorization: Bearer $TOKEN")
echo $BUILDINGS | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} buildings')"
BUILDING_ID=$(echo $BUILDINGS | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Building ID: $BUILDING_ID"

echo ""
echo "=== 2. Create New Building ==="
NEW_BUILDING=$(curl -s -X POST $BASE/projects/$PROJECT_ID/buildings \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Building B"}')
echo $NEW_BUILDING | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Created: {d[\"data\"][\"name\"]}')"

echo ""
echo "=== 3. List Floors ==="
FLOORS=$(curl -s $BASE/buildings/$BUILDING_ID/floors -H "Authorization: Bearer $TOKEN")
echo $FLOORS | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} floors')"
FLOOR_ID=$(echo $FLOORS | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Floor ID: $FLOOR_ID"

echo ""
echo "=== 4. Create New Floor ==="
curl -s -X POST $BASE/buildings/$BUILDING_ID/floors \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Floor 2"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Created: {d[\"data\"][\"name\"]}')"

echo ""
echo "=== 5. List Units ==="
UNITS=$(curl -s $BASE/floors/$FLOOR_ID/units -H "Authorization: Bearer $TOKEN")
echo $UNITS | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} units')"
UNIT_ID=$(echo $UNITS | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Unit ID: $UNIT_ID"

echo ""
echo "=== 6. Create Unit with Room Template ==="
curl -s -X POST $BASE/floors/$FLOOR_ID/units \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Unit 102","unitType":"1BR/1BA","rooms":[{"name":"Living Room","roomType":"living"},{"name":"Bedroom","roomType":"bedroom"},{"name":"Bathroom","roomType":"bathroom"},{"name":"Kitchen","roomType":"kitchen"}]}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Created: {d[\"name\"]} with {len(d[\"rooms\"])} rooms')
for r in d['rooms']:
    print(f'  - {r[\"name\"]} ({r.get(\"roomType\",\"\")})')
"

echo ""
echo "=== 7. Bulk Create Units ==="
curl -s -X POST $BASE/floors/$FLOOR_ID/units/bulk \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"prefix":"Unit ","startNumber":201,"count":3,"unitType":"Studio","roomTemplate":[{"name":"Main Room","roomType":"studio"},{"name":"Bathroom","roomType":"bathroom"}]}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total units on floor: {len(d)}')
for u in d:
    print(f'  {u[\"name\"]} ({u.get(\"unitType\",\"\")}) - {len(u[\"rooms\"])} rooms')
"

echo ""
echo "=== 8. Duplicate Unit ==="
curl -s -X POST $BASE/floors/$FLOOR_ID/units/$UNIT_ID/duplicate \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(f'Duplicated: {d[\"name\"]} with {len(d[\"rooms\"])} rooms')"

echo ""
echo "=== 9. List Rooms ==="
curl -s $BASE/units/$UNIT_ID/rooms -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} rooms')"

echo ""
echo "=== 10. Create Room ==="
curl -s -X POST $BASE/units/$UNIT_ID/rooms \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Walk-in Closet","roomType":"closet"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Created: {d[\"data\"][\"name\"]}')"

echo ""
echo "=== 11. Full Hierarchy Check ==="
curl -s $BASE/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Project: {d[\"name\"]}')
for b in d.get('buildings',[]):
    print(f'  Building: {b[\"name\"]}')
    for f in b.get('floors',[]):
        print(f'    Floor: {f[\"name\"]}')
        for u in f.get('units',[]):
            print(f'      Unit: {u[\"name\"]} ({u.get(\"unitType\",\"-\")})')
            for r in u.get('rooms',[]):
                print(f'        Room: {r[\"name\"]}')
"

echo ""
echo "=== ALL PHASE 2 API TESTS PASSED ==="
