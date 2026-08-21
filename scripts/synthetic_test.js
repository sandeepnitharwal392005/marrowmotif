const fetch = require('node-fetch') || globalThis.fetch;

const SYNTHETIC_EMAIL = 'production-test@marrowotif.internal';
const SYNTHETIC_NAME = 'Marrowotif Synthetic Test Customer';
const SYNTHETIC_PHONE = '+15550000000'; // Dummy phone
const API_URL = process.env.API_URL || 'http://localhost:4000';

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  let data;
  try {
    data = await res.json();
  } catch(e) {
    data = await res.text();
  }
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runSyntheticTest() {
  const startTime = Date.now();
  console.log('🧪 Starting Synthetic E2E Suite...');

  try {
    console.log('Logging in as Guide...');
    const guideLoginData = await request('POST', '/auth/login', {
      email: 'demo-guide@example.com',
      password: 'Demo123!'
    });
    const guideToken = guideLoginData.accessToken;
    let customerId;

    try {
      console.log('Creating/Fetching Synthetic User via Referral...');
      const refData = await request('POST', '/users/referrals', {
        customerName: SYNTHETIC_NAME,
        whatsappNumber: SYNTHETIC_PHONE,
        email: SYNTHETIC_EMAIL
      }, guideToken);
      customerId = refData.customerId;
    } catch (err) {
      console.error('Failed to create synthetic user via referral flow', err.message);
      throw err;
    }

    console.log(`User ID: ${customerId}`);
    
    console.log('Logging in as Admin...');
    const adminLoginData = await request('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    });
    const adminToken = adminLoginData.accessToken;
    
    // 2. Create Picture Book as Admin (Simulating Failure)
    console.log('Creating Picture Book (Simulating Failure)...');
    const failBook = await request('POST', '/picture-books', {
      title: `[SYNTHETIC] Automated Test Book FAIL_DRIVE ${Date.now()}`,
      userId: customerId,
      deliveryPreference: 'HOME_DELIVERY'
    }, adminToken);
    
    console.log(`Created Picture Book: ${failBook.id}`);

    // Poll for status update by worker (Should be FAILED)
    console.log('Polling for worker completion (expecting FAILED)...');
    let maxAttempts = 15;
    let delayMs = 1500;
    
    let failedStatusVerified = false;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const checkData = await request('GET', `/picture-books/${failBook.id}`, null, adminToken);
      
      if (checkData.driveStatus === 'FAILED') {
        failedStatusVerified = true;
        console.log(`✅ Verified FAILED status: ${checkData.driveError}`);
        break;
      }
    }

    if (!failedStatusVerified) {
      throw new Error(`Worker did not mark job as FAILED within ${maxAttempts * delayMs}ms.`);
    }

    // 3. Create Picture Book as Admin (Success)
    console.log('Creating Picture Book (Success)...');
    const book = await request('POST', '/picture-books', {
      title: `[SYNTHETIC] Automated Test Book ${Date.now()}`,
      userId: customerId,
      deliveryPreference: 'HOME_DELIVERY'
    }, adminToken);

    console.log(`Created Picture Book: ${book.id}`);

    // Poll for status update by worker (Should be SUCCESS)
    console.log('Polling for worker completion (expecting SUCCESS)...');
    let processed = false;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const checkData = await request('GET', `/picture-books/${book.id}`, null, adminToken);
      
      if (checkData.driveStatus === 'SUCCESS') {
        processed = true;
        console.log(`✅ Verified SUCCESS status: ${checkData.driveLink}`);
        break;
      }
    }

    if (!processed) {
      throw new Error(`Worker did not process the synthetic job within ${maxAttempts * delayMs}ms.`);
    }

    console.log('✅ Synthetic E2E Suite passed successfully.');
    
    // 4. Teardown: Clean up synthetic test data
    console.log('Cleaning up synthetic test data...');
    const cleanupRes = await request('DELETE', `/picture-books/synthetic`, null, adminToken);
    console.log(`Cleanup complete: ${cleanupRes.deletedCount} items deleted`);
    
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      type: 'synthetic_test',
      status: 'success',
      duration_ms: duration,
    }));
    
    process.exit(0);

  } catch (error) {
    console.error(`❌ Synthetic Suite failed: ${error.message}`);
    const duration = Date.now() - startTime;
    console.error(JSON.stringify({
      type: 'synthetic_test',
      status: 'failed',
      duration_ms: duration,
      error_class: 'API_ERROR',
      error_details: error.message
    }));
    process.exit(1);
  }
}

runSyntheticTest();
