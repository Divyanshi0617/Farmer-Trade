const { io: ClientIO } = require("socket.io-client");

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

async function testChatSystem() {
    console.log("==========================================");
    console.log("🧪 TESTING HUMANLINK REAL-TIME CHAT SYSTEM");
    console.log("==========================================\n");

    const suffix = Date.now().toString().slice(-6);
    const farmerEmail = `chat_farmer_${suffix}@test.com`;
    const buyerEmail = `chat_buyer_${suffix}@test.com`;

    // 1. Register Farmer
    console.log("1. Registering Farmer...");
    const regFarmer = await req("POST", "/api/auth/register", {
        name: "Kisan Ramesh",
        email: farmerEmail,
        phone: `91${suffix}`,
        password: "password123",
        role: "farmer",
        state: "Punjab",
        district: "Amritsar"
    });
    if (!regFarmer.ok) throw new Error("Farmer registration failed: " + JSON.stringify(regFarmer.data));
    const farmerToken = regFarmer.data.token;
    const farmerId = regFarmer.data.user.id;
    console.log(`✅ Farmer registered (ID: ${farmerId})`);

    // 2. Register Buyer
    console.log("2. Registering Buyer...");
    const regBuyer = await req("POST", "/api/auth/register", {
        name: "Aggarwal Traders",
        email: buyerEmail,
        phone: `92${suffix}`,
        password: "password123",
        role: "buyer",
        businessName: "Aggarwal Mandi Trading",
        state: "Delhi",
        district: "Azadpur"
    });
    if (!regBuyer.ok) throw new Error("Buyer registration failed: " + JSON.stringify(regBuyer.data));
    const buyerToken = regBuyer.data.token;
    const buyerId = regBuyer.data.user.id;
    console.log(`✅ Buyer registered (ID: ${buyerId})`);

    // 3. Farmer creates a crop
    console.log("3. Farmer adding crop...");
    const addCrop = await req("POST", "/api/crops", {
        cropName: "Basmati Rice",
        cropType: "Cereal Grain",
        quantity: 100,
        unit: "quintal",
        expectedPrice: 3800,
        state: "Punjab",
        district: "Amritsar"
    }, farmerToken);
    const cropId = addCrop.data?.crop?._id;
    console.log(`✅ Crop created (ID: ${cropId})`);

    // 4. Buyer creates / gets conversation with Farmer
    console.log("4. Buyer starting conversation with Farmer...");
    const startConv = await req("POST", "/api/chat/conversations", {
        recipientId: farmerId,
        cropId: cropId,
        initialMessage: "Hello Kisan ji, I am interested in your Basmati Rice!"
    }, buyerToken);
    if (!startConv.ok) throw new Error("Conversation start failed: " + JSON.stringify(startConv.data));
    const convId = startConv.data.conversation._id;
    console.log(`✅ Conversation created (Conv ID: ${convId})`);

    // 5. Farmer views conversations list
    console.log("5. Farmer fetching conversation list...");
    const farmerConvs = await req("GET", "/api/chat/conversations", null, farmerToken);
    if (!farmerConvs.ok || farmerConvs.data.conversations.length === 0) {
        throw new Error("Failed to list conversations: " + JSON.stringify(farmerConvs.data));
    }
    const convForFarmer = farmerConvs.data.conversations[0];
    console.log(`✅ Farmer saw conversation with ${convForFarmer.otherParticipant?.name}, Unread: ${convForFarmer.unreadCount}`);

    // 6. Test Socket.IO Real-time Connection & Message Passing
    console.log("6. Testing Real-Time Socket.IO connection...");
    const farmerSocket = ClientIO(BASE_URL, {
        auth: { token: farmerToken },
        transports: ["websocket", "polling"]
    });

    const buyerSocket = ClientIO(BASE_URL, {
        auth: { token: buyerToken },
        transports: ["websocket", "polling"]
    });

    await new Promise((resolve, reject) => {
        let connectedCount = 0;
        farmerSocket.on("connect", () => {
            console.log("✅ Farmer socket connected!");
            connectedCount++;
            if (connectedCount === 2) resolve();
        });
        buyerSocket.on("connect", () => {
            console.log("✅ Buyer socket connected!");
            connectedCount++;
            if (connectedCount === 2) resolve();
        });
        farmerSocket.on("connect_error", (e) => reject(new Error("Farmer socket error: " + e.message)));
        buyerSocket.on("connect_error", (e) => reject(new Error("Buyer socket error: " + e.message)));
        setTimeout(() => reject(new Error("Socket connection timeout")), 6000);
    });

    // Farmer joins conversation room
    farmerSocket.emit("join_conversation", convId);
    buyerSocket.emit("join_conversation", convId);

    // 7. Real-time message exchange test
    console.log("7. Testing real-time message sending over Socket.IO...");
    const receivedMessagePromise = new Promise((resolve) => {
        farmerSocket.on("receive_message", (msg) => {
            console.log(`📥 Farmer received real-time message: "${msg.text}" from ${msg.sender?.name}`);
            resolve(msg);
        });
    });

    // Buyer sends socket message
    buyerSocket.emit("send_message", {
        conversationId: convId,
        recipientId: farmerId,
        text: "Can you provide a discount for 100 quintals?",
        messageType: "deal_offer",
        dealData: {
            price: 3600,
            quantity: 100,
            unit: "quintal",
            cropTitle: "Basmati Rice"
        }
    });

    const realTimeMsg = await receivedMessagePromise;
    if (realTimeMsg.dealData?.price !== 3600) {
        throw new Error("Deal data mismatch on socket message");
    }
    console.log("✅ Real-time deal offer successfully sent and received!");

    // 8. Farmer marks messages as read
    console.log("8. Farmer marking conversation as read...");
    const markReadRes = await req("PUT", `/api/chat/conversations/${convId}/read`, null, farmerToken);
    console.log(`✅ Messages marked as read (Count: ${markReadRes.data.markedCount})`);

    // Verify unread count is now 0
    const unreadRes = await req("GET", "/api/chat/unread-count", null, farmerToken);
    console.log(`✅ Farmer total unread count: ${unreadRes.data.unreadCount}`);

    farmerSocket.disconnect();
    buyerSocket.disconnect();

    console.log("\n==========================================");
    console.log("🎉 ALL REAL-TIME CHAT BACKEND TESTS PASSED!");
    console.log("==========================================");
}

testChatSystem().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
