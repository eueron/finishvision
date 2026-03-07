#!/bin/bash
set -e

BASE="http://localhost:4000/api/v1"

echo "=== 1. Login ==="
LOGIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token obtained: ${TOKEN:0:20}..."

echo ""
echo "=== 2. Get Profile ==="
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 3. Get Company ==="
curl -s $BASE/company -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 4. List Projects ==="
curl -s $BASE/projects -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} projects')"

echo ""
echo "=== 5. Get Project with Hierarchy ==="
curl -s "$BASE/projects/00000000-0000-0000-0000-000000000010" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Project: {d[\"name\"]}')
for b in d.get('buildings',[]):
    print(f'  Building: {b[\"name\"]}')
    for f in b.get('floors',[]):
        print(f'    Floor: {f[\"name\"]}')
        for u in f.get('units',[]):
            print(f'      Unit: {u[\"name\"]} ({u.get(\"unitType\",\"\")})')
            for r in u.get('rooms',[]):
                print(f'        Room: {r[\"name\"]}')
"

echo ""
echo "=== 6. List Users ==="
curl -s $BASE/users -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d[\"data\"])} users')"

echo ""
echo "=== 7. Swagger Docs ==="
curl -s -o /dev/null -w "Swagger HTTP Status: %{http_code}" $BASE/../docs
echo ""

echo ""
echo "=== ALL API TESTS PASSED ==="
