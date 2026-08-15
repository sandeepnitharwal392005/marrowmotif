const fetch = require('node-fetch');

async function runTest() {
  const baseUrl = 'http://localhost:4000';
  
  console.log("1. Logging in as Admin...");
  const loginRes = await fetch(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'Demo123!' })
  });
  
  if (!loginRes.ok) {
    const txt = await loginRes.text();
    throw new Error("Login failed: " + txt);
  }
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  console.log("Logged in!");

  console.log("2. Searching for customer (q='API')...");
  const searchRes = await fetch(`${baseUrl}/users/search?q=API&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    const text = await searchRes.text();
    throw new Error(`Search failed: ${searchRes.status} ${text}`);
  }
  
  const searchData = await searchRes.json();
  console.log(`Found ${searchData.items?.length || 0} users.`);
  const targetUser = searchData.items?.find(u => u.name.includes('API Test User'));
  
  if (!targetUser) throw new Error("Could not find API Test User");
  
  console.log(`3. Creating Picture Book for User ID: ${targetUser.id}`);
  const pbRes = await fetch(`${baseUrl}/picture-books`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Admin Assigned Book from Script",
      userId: targetUser.id,
      deliveryPreference: "HOME_DELIVERY"
    })
  });
  
  if (!pbRes.ok) {
    const text = await pbRes.text();
    throw new Error(`Creation failed: ${pbRes.status} ${text}`);
  }
  
  const pbData = await pbRes.json();
  console.log("Success! Picture Book Created:", pbData.id);
}

runTest().catch(console.error);
