#!/bin/bash
BASE="http://127.0.0.1:5000"

echo "=== REGISTERING/LOGGING IN TEST USERS ==="

# Try register Farmer A, if fails try login
FA=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Farmer A","email":"farmer.a@test.com","password":"password123","role":"farmer"}')
TOKEN_A=$(echo $FA | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN_A" ]; then
  FA=$(curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"farmer.a@test.com","password":"password123"}')
  TOKEN_A=$(echo $FA | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
fi
echo "Farmer A Token: ${TOKEN_A:0:20}..."

# Farmer B
FB=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Farmer B","email":"farmer.b@test.com","password":"password123","role":"farmer"}')
TOKEN_B=$(echo $FB | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN_B" ]; then
  FB=$(curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"farmer.b@test.com","password":"password123"}')
  TOKEN_B=$(echo $FB | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
fi
echo "Farmer B Token: ${TOKEN_B:0:20}..."

# Buyer
BU=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Buyer A","email":"buyer.a@test.com","password":"password123","role":"buyer"}')
TOKEN_BUYER=$(echo $BU | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

if [ -z "$TOKEN_BUYER" ]; then
  BU=$(curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"buyer.a@test.com","password":"password123"}')
  TOKEN_BUYER=$(echo $BU | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
fi
echo "Buyer Token: ${TOKEN_BUYER:0:20}..."

echo ""
echo "=== UNAUTHENTICATED SECURITY ==="
echo -n "GET /api/crops/my (no token): "
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crops/my"
echo ""
echo -n "POST /api/crops (no token): "
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/crops" -H "Content-Type: application/json" -d '{}'
echo ""

echo ""
echo "=== CREATE CROP (Farmer A) ==="
CREATE_RES=$(curl -s -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"cropName":"Wheat","cropType":"Food Grain","quantity":50,"unit":"quintal","expectedPrice":2500,"harvestDate":"2026-10-15","state":"Punjab","district":"Ludhiana","village":"Test Village","description":"Fresh wheat crop"}')
echo "Create status: $(echo $CREATE_RES | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',''), d.get('message',''))" 2>/dev/null)"
echo "Full create response: $CREATE_RES"
CROP_ID=$(echo $CREATE_RES | python3 -c "import sys,json; d=json.load(sys.stdin); c=d.get('crop',d); print(c.get('_id',''))" 2>/dev/null)
echo "Crop ID: $CROP_ID"

echo ""
echo "=== CREATE SECOND CROP (for count test) ==="
CREATE_RES2=$(curl -s -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"cropName":"Rice","cropType":"Food Grain","quantity":30,"unit":"quintal","expectedPrice":3500,"harvestDate":"2026-11-15","state":"Punjab","district":"Ludhiana","village":"Test Village","description":"Fresh rice crop"}')
CROP_ID2=$(echo $CREATE_RES2 | python3 -c "import sys,json; d=json.load(sys.stdin); c=d.get('crop',d); print(c.get('_id',''))" 2>/dev/null)
echo "Crop 2 ID: $CROP_ID2"

echo ""
echo "=== GET MY CROPS ==="
MY_CROPS=$(curl -s "$BASE/api/crops/my" \
  -H "Authorization: Bearer $TOKEN_A")
echo "My crops response: $MY_CROPS"

echo ""
echo "=== GET SINGLE CROP (Farmer A - owner) ==="
echo -n "GET /api/crops/$CROP_ID (owner): "
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""

echo ""
echo "=== GET SINGLE CROP (Farmer B - non-owner) ==="
echo -n "GET /api/crops/$CROP_ID (non-owner): "
curl -s "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_B"
echo ""

echo ""
echo "=== UPDATE CROP (Farmer A - owner) ==="
echo -n "PUT /api/crops/$CROP_ID (owner): "
UPDATE_RES=$(curl -s -X PUT "$BASE/api/crops/$CROP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"quantity":60,"expectedPrice":2600,"description":"Updated wheat crop"}')
echo "$UPDATE_RES"

echo ""
echo "=== UPDATE CROP (Farmer B - non-owner) ==="
echo -n "PUT /api/crops/$CROP_ID (non-owner): "
curl -s -X PUT "$BASE/api/crops/$CROP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"quantity":99}'
echo ""

echo ""
echo "=== STATUS MANAGEMENT ==="
echo -n "PATCH status=sold (owner): "
curl -s -X PATCH "$BASE/api/crops/$CROP_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status":"sold"}'
echo ""

echo -n "PATCH status=inactive (owner): "
curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crops/$CROP_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status":"inactive"}'
echo ""

echo -n "PATCH status=random (invalid): "
INVALID_STATUS=$(curl -s -X PATCH "$BASE/api/crops/$CROP_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"status":"random"}')
echo "$INVALID_STATUS"

echo -n "PATCH status (non-owner, Farmer B): "
curl -s -X PATCH "$BASE/api/crops/$CROP_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d '{"status":"sold"}'
echo ""

echo ""
echo "=== BUYER ROLE SECURITY ==="
echo -n "Buyer POST /api/crops: "
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_BUYER" \
  -d '{"cropName":"Wheat","cropType":"Food Grain","quantity":50,"unit":"quintal","expectedPrice":2500,"state":"Punjab","district":"Ludhiana"}'
echo ""
echo -n "Buyer PUT /api/crops/$CROP_ID: "
curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/crops/$CROP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_BUYER" \
  -d '{"quantity":99}'
echo ""
echo -n "Buyer DELETE /api/crops/$CROP_ID: "
curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_BUYER"
echo ""
echo -n "Buyer PATCH /api/crops/$CROP_ID/status: "
curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crops/$CROP_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_BUYER" \
  -d '{"status":"sold"}'
echo ""

echo ""
echo "=== INVALID CROP ID ==="
echo -n "GET /api/crops/invalidid: "
curl -s "$BASE/api/crops/invalidid" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""

echo ""
echo "=== DASHBOARD CROP COUNT CHECK ==="
echo "Get stats for farmer (my crops count):"
curl -s "$BASE/api/crops/my" \
  -H "Authorization: Bearer $TOKEN_A" | python3 -c "import sys,json; d=json.load(sys.stdin); crops=d if isinstance(d,list) else d.get('crops', d.get('data',[])); print('Crop Count:', len(crops))"

echo ""
echo "=== DELETE CROP (Farmer B - non-owner) ==="
echo -n "DELETE /api/crops/$CROP_ID (non-owner): "
curl -s -X DELETE "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_B"
echo ""

echo ""
echo "=== DELETE CROP (Farmer A - owner) ==="
echo -n "DELETE /api/crops/$CROP_ID (owner): "
curl -s -X DELETE "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""
echo -n "DELETE /api/crops/$CROP_ID2 (owner): "
curl -s -X DELETE "$BASE/api/crops/$CROP_ID2" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""

echo ""
echo "=== VERIFY DELETION ==="
echo -n "GET /api/crops/$CROP_ID after delete: "
curl -s "$BASE/api/crops/$CROP_ID" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""

echo ""
echo "=== VALIDATION: MISSING FIELDS ==="
echo -n "POST with empty cropName: "
curl -s -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"cropName":"","quantity":50,"unit":"quintal","expectedPrice":2500,"state":"Punjab","district":"Ludhiana"}'
echo ""

echo -n "POST with negative quantity: "
curl -s -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"cropName":"Test","quantity":-5,"unit":"quintal","expectedPrice":2500,"state":"Punjab","district":"Ludhiana"}'
echo ""

echo -n "POST with negative expectedPrice: "
curl -s -X POST "$BASE/api/crops" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"cropName":"Test","quantity":10,"unit":"quintal","expectedPrice":-100,"state":"Punjab","district":"Ludhiana"}'
echo ""

echo ""
echo "=== REGRESSION: FARMER LOGIN ==="
echo -n "Farmer login: "
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer.a@test.com","password":"password123"}'
echo ""

echo "=== REGRESSION: BUYER LOGIN ==="
echo -n "Buyer login: "
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer.a@test.com","password":"password123"}'
echo ""

echo "=== REGRESSION: GET ME ==="
echo -n "GET /api/auth/me (farmer): "
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN_A"
echo ""

echo ""
echo "=== ALL TESTS COMPLETE ==="
