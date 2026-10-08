/**
 * Complete End-to-End System & API Verification Test Suite
 * Tests every single domain and function of HumanLink / FarmerTrade:
 * 1. Health check
 * 2. Auth (Register, Login, Profile) for Farmer & Buyer
 * 3. Crops (Create, List, Details, Update)
 * 4. Marketplace (Browse, Filter, Details)
 * 5. Offers (Create, Received, My, Accept)
 * 6. Transactions (Create from offer, List, Details, Cost breakdown)
 * 7. Logistics (Book from transaction, List, Status update)
 * 8. Storage (Book from transaction, List, Status update)
 * 9. Market Prices (Query, Filter, History, Live Mandi Sync)
 * 10. FarmerDesk AI (Suggestions, Chat query with Gemini)
 */

const BASE_URL = "http://127.0.0.1:5000";

async function req(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runAllTests() {
  console.log("=================================================");
  console.log("🧪 STARTING COMPLETE SYSTEM FUNCTIONALITY TESTS");
  console.log("=================================================\n");

  const results = [];
  function assert(title, condition, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      results.push({ title, pass: true });
    } else {
      console.error(`❌ FAIL: ${title} - ${details}`);
      results.push({ title, pass: false, details });
    }
  }

  const suffix = Date.now().toString().slice(-7);
  const farmerEmail = `farmer_${suffix}@test.com`;
  const farmerPhone = `98${suffix}`;
  const buyerEmail = `buyer_${suffix}@test.com`;
  const buyerPhone = `97${suffix}`;

  let farmerToken = null;
  let buyerToken = null;
  let createdCropId = null;
  let createdOfferId = null;
  let createdTxId = null;
  let createdLogId = null;
  let createdStoreId = null;

  // 1. HEALTH CHECK
  console.log("\n--- [1] API HEALTH CHECK ---");
  const healthRes = await req("GET", "/api/health");
  assert("Backend Health Check", healthRes.ok && healthRes.data.success);

  // 2. AUTHENTICATION & PROFILES
  console.log("\n--- [2] AUTHENTICATION & PROFILES ---");
  const regFarmer = await req("POST", "/api/auth/register", {
    name: "Ramesh Kumar",
    email: farmerEmail,
    phone: farmerPhone,
    password: "password123",
    role: "farmer",
    state: "Punjab",
    district: "Ludhiana"
  });
  farmerToken = regFarmer.data.token;
  assert("Register Farmer", regFarmer.ok && !!farmerToken, JSON.stringify(regFarmer.data));

  const regBuyer = await req("POST", "/api/auth/register", {
    name: "Sharma Agro Traders",
    email: buyerEmail,
    phone: buyerPhone,
    password: "password123",
    role: "buyer",
    businessName: "Sharma Wholesalers",
    businessType: "Wholesaler",
    state: "Delhi",
    district: "North Delhi"
  });
  buyerToken = regBuyer.data.token;
  assert("Register Buyer", regBuyer.ok && !!buyerToken, JSON.stringify(regBuyer.data));

  const loginFarmer = await req("POST", "/api/auth/login", {
    email: farmerEmail,
    password: "password123"
  });
  assert("Login Farmer", loginFarmer.ok && !!loginFarmer.data.token);

  const meFarmer = await req("GET", "/api/auth/me", null, farmerToken);
  assert("Farmer Profile (/api/auth/me)", meFarmer.ok && meFarmer.data.user?.name === "Ramesh Kumar");

  // 3. CROPS MANAGEMENT
  console.log("\n--- [3] CROPS MANAGEMENT (FARMER) ---");
  const cropAdd = await req("POST", "/api/crops", {
    cropName: "Wheat",
    cropType: "Cereal Grain",
    quantity: 50,
    unit: "quintal",
    expectedPrice: 2600,
    harvestDate: "2026-10-15",
    state: "Punjab",
    district: "Ludhiana",
    village: "Khanna Kalan",
    description: "High protein, golden harvest wheat stored in dry conditions."
  }, farmerToken);
  createdCropId = cropAdd.data.crop?._id;
  assert("Create Crop Listing", cropAdd.ok && !!createdCropId, JSON.stringify(cropAdd.data));

  const myCrops = await req("GET", "/api/crops/my", null, farmerToken);
  assert("Get My Crops", myCrops.ok && Array.isArray(myCrops.data.crops) && myCrops.data.crops.length > 0);

  const cropDetail = await req("GET", `/api/crops/${createdCropId}`, null, farmerToken);
  assert("Get Crop Details", cropDetail.ok && cropDetail.data.crop?.cropName === "Wheat");

  const cropUpdate = await req("PUT", `/api/crops/${createdCropId}`, {
    expectedPrice: 2650
  }, farmerToken);
  assert("Update Crop Listing", cropUpdate.ok && cropUpdate.data.crop?.expectedPrice === 2650);

  // 4. MARKETPLACE (BUYER DISCOVERY)
  console.log("\n--- [4] MARKETPLACE DISCOVERY (BUYER) ---");
  const marketCrops = await req("GET", "/api/marketplace/crops?cropName=Wheat");
  assert("Browse Marketplace Crops", marketCrops.ok && Array.isArray(marketCrops.data.crops));

  const marketCropDetail = await req("GET", `/api/marketplace/crops/${createdCropId}`);
  assert("View Marketplace Crop Details", marketCropDetail.ok && marketCropDetail.data.crop?._id === createdCropId);

  // 5. OFFERS & NEGOTIATION
  console.log("\n--- [5] OFFERS & NEGOTIATION ---");
  const makeOffer = await req("POST", "/api/offers", {
    cropId: createdCropId,
    offeredPrice: 2620,
    quantity: 30,
    message: "Can pick up directly from your farm yard."
  }, buyerToken);
  createdOfferId = makeOffer.data.offer?._id;
  assert("Buyer Makes Offer", makeOffer.ok && !!createdOfferId, JSON.stringify(makeOffer.data));

  const buyerOffers = await req("GET", "/api/offers/my", null, buyerToken);
  assert("Buyer View My Offers", buyerOffers.ok && buyerOffers.data.offers?.length > 0);

  const farmerOffers = await req("GET", "/api/offers/received", null, farmerToken);
  assert("Farmer View Received Offers", farmerOffers.ok && farmerOffers.data.offers?.length > 0);

  const acceptOffer = await req("PATCH", `/api/offers/${createdOfferId}/accept`, {}, farmerToken);
  assert("Farmer Accepts Offer", acceptOffer.ok && acceptOffer.data.offer?.status === "accepted", JSON.stringify(acceptOffer.data));

  // 6. TRANSACTIONS & DEALS
  console.log("\n--- [6] TRANSACTIONS & DEALS ---");
  const createTx = await req("POST", `/api/transactions/from-offer/${createdOfferId}`, {}, farmerToken);
  createdTxId = createTx.data.transaction?._id;
  assert("Create Transaction from Offer", createTx.ok && !!createdTxId, JSON.stringify(createTx.data));

  const farmerTxList = await req("GET", "/api/transactions/my", null, farmerToken);
  assert("Farmer View Transactions", farmerTxList.ok && farmerTxList.data.transactions?.length > 0);

  const buyerTxList = await req("GET", "/api/transactions/my", null, buyerToken);
  assert("Buyer View Deals", buyerTxList.ok && buyerTxList.data.transactions?.length > 0);

  const txDetails = await req("GET", `/api/transactions/${createdTxId}`, null, farmerToken);
  assert("Transaction Details", txDetails.ok && txDetails.data.transaction?.grossAmount === (30 * 2620));

  // 7. LOGISTICS & TRANSPORT
  console.log("\n--- [7] LOGISTICS & TRANSPORT ---");
  const bookLogistics = await req("POST", `/api/logistics/from-transaction/${createdTxId}`, {
    pickupLocation: "Khanna Kalan, Ludhiana, Punjab",
    deliveryLocation: "Naveen Subzi Mandi, Azadpur, Delhi",
    transportType: "truck",
    vehicleNumber: "PB-10-CZ-4321",
    driverName: "Gurpreet Singh",
    driverPhone: "9812345678",
    transportCost: 3500,
    estimatedPickupDate: "2026-10-18"
  }, farmerToken);
  createdLogId = bookLogistics.data.logistics?._id;
  assert("Book Logistics", bookLogistics.ok && !!createdLogId, JSON.stringify(bookLogistics.data));

  const myLogistics = await req("GET", "/api/logistics/my", null, farmerToken);
  assert("View Logistics Bookings", myLogistics.ok && myLogistics.data.logistics?.length > 0);

  const updateLogStatus = await req("PATCH", `/api/logistics/${createdLogId}/status`, {
    status: "assigned"
  }, farmerToken);
  assert("Update Logistics Status (assigned)", updateLogStatus.ok && updateLogStatus.data.logistics?.status === "assigned", JSON.stringify(updateLogStatus.data));

  // 8. STORAGE & WAREHOUSE
  console.log("\n--- [8] COLD STORAGE & WAREHOUSING ---");
  const bookStorage = await req("POST", `/api/storage/from-transaction/${createdTxId}`, {
    storageName: "Ludhiana Central Agro Warehouse",
    storageLocation: "GT Road Industrial Area, Ludhiana",
    storageType: "warehouse",
    quantity: 20,
    entryDate: "2026-10-20",
    expectedExitDate: "2026-11-20",
    storageCost: 600
  }, farmerToken);
  createdStoreId = bookStorage.data.storage?._id;
  assert("Book Warehouse / Storage", bookStorage.ok && !!createdStoreId, JSON.stringify(bookStorage.data));

  const myStorage = await req("GET", "/api/storage/my", null, farmerToken);
  assert("View Storage Bookings", myStorage.ok && myStorage.data.storage?.length > 0);

  const updateStoreStatus = await req("PATCH", `/api/storage/${createdStoreId}/status`, {
    status: "released"
  }, farmerToken);
  assert("Update Storage Status (released)", updateStoreStatus.ok && updateStoreStatus.data.storage?.status === "released", JSON.stringify(updateStoreStatus.data));

  // 9. MARKET PRICES (MANDI)
  console.log("\n--- [9] MARKET PRICES (MANDI) ---");
  const getPrices = await req("GET", "/api/market-prices");
  assert("Get Market Prices", getPrices.ok && getPrices.data.count > 0);

  const filterPrices = await req("GET", "/api/market-prices?crop=Wheat&state=Punjab");
  assert("Filter Market Prices by Crop & State", filterPrices.ok && filterPrices.data.marketPrices?.length > 0);

  const priceHistory = await req("GET", "/api/market-prices/history/Wheat");
  assert("Get Crop Price History", priceHistory.ok && Array.isArray(priceHistory.data.history));

  const syncPrices = await req("POST", "/api/market-prices/sync-government");
  assert("Live Mandi Sync Endpoint", syncPrices.ok && syncPrices.data.success);

  // 10. FARMERDESK AI CHATBOT (GEMINI)
  console.log("\n--- [10] FARMERDESK AI CHATBOT (GEMINI) ---");
  const aiSuggestions = await req("GET", "/api/ai/suggestions?role=farmer");
  assert("FarmerDesk AI Suggestions", aiSuggestions.ok && Array.isArray(aiSuggestions.data.suggestions) && aiSuggestions.data.suggestions.length > 0);

  const aiChat = await req("POST", "/api/ai/chat", {
    messages: [
      { role: "user", content: "What is the recommended harvesting moisture level for wheat?" }
    ],
    userContext: { role: "farmer", name: "Ramesh Kumar" }
  });
  assert("FarmerDesk AI Chat with Gemini", aiChat.ok && !!aiChat.data.reply && aiChat.data.reply.length > 10);
  if (aiChat.data.reply) {
    console.log(`   [FarmerDesk AI response sample]: "${aiChat.data.reply.substring(0, 100)}..." (Model: ${aiChat.data.model})`);
  }

  // 11. REAL-TIME CHAT & MESSAGING BETWEEN FARMER AND BUYER
  console.log("\n--- [11] REAL-TIME CHAT & MESSAGING (FARMER & BUYER) ---");
  // Buyer initiates conversation with Farmer regarding created crop
  const chatConv = await req("POST", "/api/chat/conversations", {
    recipientId: regFarmer.data.user.id,
    cropId: createdCropId,
    initialMessage: "Namaste Ramesh ji, I want to discuss your crop."
  }, buyerToken);
  assert("Initiate Chat Conversation", chatConv.ok && !!chatConv.data.conversation?._id);
  const chatId = chatConv.data.conversation?._id;

  // Buyer sends a deal offer in chat
  const sendMsg = await req("POST", `/api/chat/conversations/${chatId}/messages`, {
    text: "Can you supply 40 quintals at ₹2,100 per quintal?",
    messageType: "deal_offer",
    dealData: {
      price: 2100,
      quantity: 40,
      unit: "quintal",
      cropTitle: "Wheat"
    }
  }, buyerToken);
  assert("Send In-Chat Negotiation Message", sendMsg.ok && sendMsg.data.message?.dealData?.price === 2100);

  // Farmer lists conversations
  const farmerConvs = await req("GET", "/api/chat/conversations", null, farmerToken);
  assert("Farmer Fetch Conversations", farmerConvs.ok && farmerConvs.data.conversations?.length > 0);

  // Farmer fetches messages
  const chatMsgs = await req("GET", `/api/chat/conversations/${chatId}/messages`, null, farmerToken);
  assert("Fetch Chat Message History", chatMsgs.ok && chatMsgs.data.messages?.length >= 2);

  // Farmer marks messages as read
  const markRead = await req("PUT", `/api/chat/conversations/${chatId}/read`, null, farmerToken);
  assert("Mark Messages As Read", markRead.ok && markRead.data.success);

  // Farmer checks unread count
  const unreadCount = await req("GET", "/api/chat/unread-count", null, farmerToken);
  assert("Global Unread Count (0 after read)", unreadCount.ok && unreadCount.data.unreadCount === 0);

  // SUMMARY
  console.log("\n=================================================");

  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`📊 FINAL TEST REPORT: ${passed}/${total} TESTS PASSED (${failed} failures)`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
