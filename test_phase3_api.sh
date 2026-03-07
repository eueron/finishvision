#!/bin/bash
set -e

BASE="http://localhost:4000/api/v1"

echo "=== Login ==="
LOGIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@2024!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Token: ${TOKEN:0:20}..."

PROJECT_ID="00000000-0000-0000-0000-000000000010"

# Create a small test PDF
echo "=== Creating test PDF ==="
python3 -c "
from fpdf import FPDF
pdf = FPDF()
for i in range(3):
    pdf.add_page()
    pdf.set_font('Arial', 'B', 24)
    pdf.cell(0, 40, f'Sheet {i+1}', ln=True, align='C')
    pdf.set_font('Arial', '', 14)
    pdf.cell(0, 10, f'Floor Plan - Level {i+1}', ln=True, align='C')
    pdf.cell(0, 10, 'Scale: 1/4\" = 1\"-0\"', ln=True, align='C')
    # Draw some rectangles to simulate rooms
    pdf.rect(30, 80, 60, 40)
    pdf.rect(100, 80, 60, 40)
    pdf.rect(30, 130, 130, 50)
    pdf.set_font('Arial', '', 10)
    pdf.text(45, 100, 'Bedroom 1')
    pdf.text(115, 100, 'Bedroom 2')
    pdf.text(75, 155, 'Living Room')
pdf.output('/tmp/test_blueprint.pdf')
print('Test PDF created: 3 pages')
"

echo ""
echo "=== 1. Upload Blueprint ==="
UPLOAD_RESULT=$(curl -s -X POST "$BASE/projects/$PROJECT_ID/blueprints/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_blueprint.pdf")
echo $UPLOAD_RESULT | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Blueprint ID: {d[\"id\"]}')
print(f'Name: {d[\"originalName\"]}')
print(f'Status: {d[\"status\"]}')
print(f'Size: {d[\"fileSize\"]} bytes')
"
BLUEPRINT_ID=$(echo $UPLOAD_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

echo ""
echo "=== 2. Wait for processing... ==="
sleep 5

echo ""
echo "=== 3. Get Blueprint with Sheets ==="
curl -s "$BASE/projects/$PROJECT_ID/blueprints/$BLUEPRINT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Blueprint: {d[\"originalName\"]}')
print(f'Status: {d[\"status\"]}')
print(f'Pages: {d[\"pageCount\"]}')
print(f'Sheets: {len(d[\"sheets\"])}')
for s in d['sheets']:
    print(f'  Page {s[\"pageNumber\"]}: {s[\"sheetName\"]} ({s[\"sheetType\"]}) - {s.get(\"width\",\"?\")}x{s.get(\"height\",\"?\")}')
    if s.get('imagePath'):
        print(f'    Image: {s[\"imagePath\"]}')
    if s.get('thumbnailPath'):
        print(f'    Thumb: {s[\"thumbnailPath\"]}')
"

echo ""
echo "=== 4. List All Blueprints ==="
curl -s "$BASE/projects/$PROJECT_ID/blueprints" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Total blueprints: {len(d)}')
for b in d:
    print(f'  {b[\"originalName\"]} - {b[\"status\"]} - {b.get(\"_count\",{}).get(\"sheets\",0)} sheets')
"

echo ""
echo "=== 5. Get Sheet Details ==="
SHEET_ID=$(curl -s "$BASE/projects/$PROJECT_ID/blueprints/$BLUEPRINT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['sheets'][0]['id'])")
echo "Sheet ID: $SHEET_ID"

curl -s "$BASE/sheets/$SHEET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Sheet: {d[\"sheetName\"]}')
print(f'Type: {d[\"sheetType\"]}')
print(f'Page: {d[\"pageNumber\"]}')
"

echo ""
echo "=== 6. Update Sheet Metadata ==="
curl -s -X PATCH "$BASE/sheets/$SHEET_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sheetName":"A1.01 - Floor Plan Level 1","sheetType":"FLOOR_PLAN"}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Updated: {d[\"sheetName\"]} ({d[\"sheetType\"]})')
"

echo ""
echo "=== 7. Update Sheet Scale ==="
curl -s -X PATCH "$BASE/sheets/$SHEET_ID/scale" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"scaleText":"1/4\" = 1\"-0\"","scaleFactor":48}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Scale: {d[\"scaleText\"]} (factor: {d[\"scaleFactor\"]})')
"

echo ""
echo "=== 8. List Sheets by Blueprint ==="
curl -s "$BASE/sheets/blueprint/$BLUEPRINT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'Sheets in blueprint: {len(d)}')
for s in d:
    print(f'  Page {s[\"pageNumber\"]}: {s[\"sheetName\"]} ({s[\"sheetType\"]})')
"

echo ""
echo "=== ALL PHASE 3 API TESTS PASSED ==="
