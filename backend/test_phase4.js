const http = require('http');

async function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log("Starting API Tests...");
  
  // Register Farmer A
  let res = await request('POST', '/api/auth/register', {
    name: 'Farmer A',
    email: 'farmer.a@test.com',
    phone: '9876543210',
    password: 'password123',
    role: 'farmer'
  });
  let tokenA = res.body.token;
  if (!tokenA) {
     res = await request('POST', '/api/auth/login', { email: 'farmer.a@test.com', password: 'password123' });
     tokenA = res.body.token;
  }
  
  // Register Farmer B
  res = await request('POST', '/api/auth/register', {
    name: 'Farmer B',
    email: 'farmer.b@test.com',
    phone: '9876543211',
    password: 'password123',
    role: 'farmer'
  });
  let tokenB = res.body.token;
  if (!tokenB) {
     res = await request('POST', '/api/auth/login', { email: 'farmer.b@test.com', password: 'password123' });
     tokenB = res.body.token;
  }
  
  // Register Buyer A
  res = await request('POST', '/api/auth/register', {
    name: 'Buyer A',
    email: 'buyer.a@test.com',
    phone: '9876543212',
    password: 'password123',
    role: 'buyer'
  });
  let tokenBuyer = res.body.token;
  if (!tokenBuyer) {
     res = await request('POST', '/api/auth/login', { email: 'buyer.a@test.com', password: 'password123' });
     tokenBuyer = res.body.token;
  }
  
  console.log("Tokens fetched:", { tokenA: !!tokenA, tokenB: !!tokenB, tokenBuyer: !!tokenBuyer });

  // UNAUTHENTICATED SECURITY
  res = await request('GET', '/api/crops/my');
  console.log("Unauth GET /api/crops/my:", res.status);
  
  // CREATE CROP
  const cropData = {
    cropName: "Wheat",
    cropType: "Food Grain",
    quantity: 50,
    unit: "quintal",
    expectedPrice: 2500,
    harvestDate: "2026-10-15",
    state: "Punjab",
    district: "Ludhiana",
    village: "Test Village",
    description: "Fresh wheat crop"
  };
  res = await request('POST', '/api/crops', cropData, tokenA);
  console.log("Create Crop status:", res.status);
  console.log("Create Crop body:", res.body);
  const cropId = res.body?.crop?._id || res.body?._id;
  
  if (!cropId) {
    console.log("Failed to create crop. Exiting.");
    return;
  }

  // GET MY CROPS
  res = await request('GET', '/api/crops/my', null, tokenA);
  console.log("GET My crops A status:", res.status);
  console.log("GET My crops A count:", Array.isArray(res.body) ? res.body.length : res.body.data?.length);

  // VIEW SINGLE CROP
  res = await request('GET', `/api/crops/${cropId}`, null, tokenA);
  console.log("GET single crop status:", res.status);

  // VIEW SINGLE CROP AS FARMER B (Should fail if owner check is not strictly enforced, wait, other farmers might not view, let's test)
  res = await request('GET', `/api/crops/${cropId}`, null, tokenB);
  console.log("Farmer B GET single crop A status:", res.status);

  // BUYER ROLE SECURITY
  res = await request('POST', `/api/crops`, cropData, tokenBuyer);
  console.log("Buyer POST crop status:", res.status);
  res = await request('PUT', `/api/crops/${cropId}`, { quantity: 60 }, tokenBuyer);
  console.log("Buyer PUT crop status:", res.status);
  
  // OWNERSHIP SECURITY
  res = await request('PUT', `/api/crops/${cropId}`, { quantity: 60 }, tokenB);
  console.log("Farmer B PUT crop A status:", res.status);
  
  // UPDATE CROP
  res = await request('PUT', `/api/crops/${cropId}`, { quantity: 60, expectedPrice: 2600 }, tokenA);
  console.log("Update Crop status:", res.status);
  
  // STATUS UPDATE
  res = await request('PATCH', `/api/crops/${cropId}/status`, { status: 'sold' }, tokenA);
  console.log("Update status status:", res.status);

  // INVALID STATUS
  res = await request('PATCH', `/api/crops/${cropId}/status`, { status: 'random' }, tokenA);
  console.log("Update invalid status:", res.status);
  
  // DELETE CROP (Farmer B)
  res = await request('DELETE', `/api/crops/${cropId}`, null, tokenB);
  console.log("Farmer B DELETE crop status:", res.status);

  // DELETE CROP (Farmer A)
  res = await request('DELETE', `/api/crops/${cropId}`, null, tokenA);
  console.log("Delete crop status:", res.status);
  
  // Verify deletion
  res = await request('GET', `/api/crops/${cropId}`, null, tokenA);
  console.log("GET deleted crop status:", res.status);

}
runTests();
