const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null }));
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const uniqueId = Date.now();
  const email = `api_user_${uniqueId}@example.com`;
  
  try {
    console.log("1. Register User...");
    const regRes = await request('POST', '/users', {
      name: "API Test User",
      email: email,
      password: "Password123!",
      phone: "+123456"
    });
    console.log("Register Res:", regRes.status);
    if (regRes.status !== 201) throw new Error("Registration failed");

    console.log("2. Login User...");
    const loginRes = await request('POST', '/auth/login', {
      email: email,
      password: "Password123!"
    });
    console.log("Login Res:", loginRes.status, loginRes.data);
    if (loginRes.status !== 200) throw new Error("Login failed");
    
    const token = loginRes.data.accessToken;

    console.log("3. Create Picture Book...");
    const pbRes = await request('POST', '/picture-books', {
      title: "API Safari",
      deliveryPreference: "HOME_DELIVERY"
    }, token);
    console.log("Picture Book Res:", pbRes.status);
    if (pbRes.status !== 201) throw new Error("Picture Book failed");
    
    const pbId = pbRes.data.id;

    console.log("4. Login as Admin...");
    const adminLogin = await request('POST', '/auth/login', {
      email: "admin@example.com",
      password: "Demo123!"
    });
    console.log("Admin Login Res:", adminLogin.status);
    if (adminLogin.status !== 200) throw new Error("Admin login failed");
    const adminToken = adminLogin.data.accessToken;

    console.log("5. Admin Trigger Drive Generation...");
    const driveRes = await request('POST', `/picture-books/${pbId}/drive`, {}, adminToken);
    console.log("Drive Res:", driveRes.status);
    
    console.log("6. Admin Trigger WhatsApp...");
    const waRes = await request('POST', `/picture-books/${pbId}/whatsapp`, {
      template: "welcome_client"
    }, adminToken);
    console.log("WhatsApp Res:", waRes.status);

    console.log("=== API TESTS PASS ===");
  } catch(e) {
    console.error("API TEST ERROR:", e);
  }
})();
