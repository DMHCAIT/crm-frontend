#!/bin/bash

# Cunnekt WhatsApp API Endpoint Test Script
# This script tests all Cunnekt WhatsApp API endpoints

echo "🧪 Testing Cunnekt WhatsApp API Endpoints"
echo "=========================================="
echo ""

BASE_URL="https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Connection..."
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}?action=test-connection")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Connection test PASSED${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Connection test FAILED (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Test 2: Send Single Message (will fail without valid phone, but tests endpoint)
echo "2️⃣  Testing Send Single Message Endpoint..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}?action=send-message" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "message": "Test message from endpoint test",
    "leadId": "test_lead_123"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✅ Send message endpoint ACCESSIBLE${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Send message endpoint ERROR (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Test 3: Webhook Endpoint
echo "3️⃣  Testing Webhook Endpoint..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}?action=webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.received",
    "data": {
      "from": "9876543210",
      "message": "Test webhook message",
      "messageId": "test_webhook_123"
    }
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Webhook endpoint WORKING${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Webhook endpoint FAILED (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Test 4: Get Campaigns
echo "4️⃣  Testing Get Campaigns..."
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}?action=get-campaigns")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Get campaigns WORKING${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Get campaigns FAILED (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Test 5: Get Responses
echo "5️⃣  Testing Get Responses..."
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}?action=get-responses&limit=5")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Get responses WORKING${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Get responses FAILED (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Test 6: Save Campaign
echo "6️⃣  Testing Save Campaign..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}?action=save-campaign" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "template": "Hello {name}, this is a test campaign!",
    "segmentFilters": {"country": "US"},
    "leadCount": 10,
    "userId": "1"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Save campaign WORKING${NC}"
    echo "   Response: $body"
else
    echo -e "${YELLOW}⚠️  Save campaign needs database setup (HTTP $http_code)${NC}"
    echo "   Response: $body"
    echo "   Note: Run create-campaigns-table.sql in Supabase first"
fi
echo ""

# Test 7: Invalid Action
echo "7️⃣  Testing Invalid Action (should fail gracefully)..."
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}?action=invalid-action-test")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✅ Error handling WORKING${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Error handling UNEXPECTED (HTTP $http_code)${NC}"
    echo "   Response: $body"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo ""
echo "✅ = Endpoint working correctly"
echo "⚠️  = Endpoint accessible but may need configuration"
echo "❌ = Endpoint has issues"
echo ""
echo "🔗 Webhook URL for Cunnekt Dashboard:"
echo "   ${BASE_URL}?action=webhook"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   - WEBHOOK_SETUP_GUIDE.md"
echo "   - DATABASE_SETUP_INSTRUCTIONS.md"
echo ""
