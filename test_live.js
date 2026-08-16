const API_URL = 'https://api-production-debe.up.railway.app/api';

async function apiFetch(path, options = {}) {
  const { token, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(rest.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });
  
  if (!res.ok) {
    let errorData = null;
    try { errorData = await res.json(); } catch(e) {}
    throw new Error(`API Error ${res.status}: ${JSON.stringify(errorData) || res.statusText}`);
  }
  
  // If no content, just return true
  if (res.status === 204 || res.headers.get('content-length') === '0') return true;
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return true;
}

async function login(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

async function runTests() {
  const results = [];
  function log(msg) {
    console.log(msg);
    results.push(msg);
  }

  try {
    log('--- STARTING E2E LIVE API TESTS ---');

    // 1. Authenticate Admin
    log('Authenticating Admin...');
    const adminAuth = await login('admin@morrowotif.com', 'Admin123!');
    log(`✅ Admin logged in: ${adminAuth.user.id}`);

    // 2. Authenticate User
    log('Authenticating User...');
    const userAuth = await login('user@gmail.com', 'User123!');
    log(`✅ User logged in: ${userAuth.user.id}`);

    // 3. Authenticate Guide
    log('Authenticating Guide...');
    const guideAuth = await login('guide@gmail.com', 'Guide123!');
    log(`✅ Guide logged in: ${guideAuth.user.id}`);

    // 4. Admin creates a Picture Book for User
    log('Admin creating a Picture Book for User...');
    const adminPb = await apiFetch('/picture-books', {
      method: 'POST',
      token: adminAuth.accessToken,
      body: JSON.stringify({
        title: 'Admin Created Test Book',
        userId: userAuth.user.id
      })
    });
    log(`✅ Admin successfully created Picture Book: ${adminPb.id}`);

    // 5. Guide creates a Picture Book (Referral flow)
    log('Guide referring a new customer (Picture Book)...');
    const guidePb = await apiFetch('/picture-books', {
      method: 'POST',
      token: guideAuth.accessToken,
      body: JSON.stringify({
        title: 'Guide Referred Test Book',
        customerName: 'Test Customer',
        whatsappNumber: '+1234567890',
        email: `test-${Date.now()}@test.com`
      })
    });
    log(`✅ Guide successfully created Picture Book & User: ${guidePb.id}`);

    // 6. User creates their own Picture Book
    log('User creating their own Picture Book...');
    const userPb = await apiFetch('/picture-books', {
      method: 'POST',
      token: userAuth.accessToken,
      body: JSON.stringify({
        title: 'User Self Test Book',
        deliveryPreference: 'HOME_DELIVERY'
      })
    });
    log(`✅ User successfully created Picture Book: ${userPb.id}`);

    // 7. Admin updates status
    log('Admin updating status of User book to IN_PRODUCTION...');
    await apiFetch(`/picture-books/${userPb.id}/status`, {
      method: 'PATCH',
      token: adminAuth.accessToken,
      body: JSON.stringify({ status: 'IN_PRODUCTION' })
    });
    log(`✅ Admin successfully updated status`);

    // 8. Admin fetches stats
    log('Admin fetching stats...');
    const stats = await apiFetch('/picture-books/stats', {
      method: 'GET',
      token: adminAuth.accessToken
    });
    log(`✅ Stats fetched: ${JSON.stringify(stats)}`);

    // 9. User fetches their books
    log('User fetching their books...');
    const userBooks = await apiFetch('/picture-books', {
      method: 'GET',
      token: userAuth.accessToken
    });
    log(`✅ User has ${userBooks.meta.total} books`);

    log('--- ALL TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    log(`❌ TEST FAILED: ${err.message}`);
    console.error(err);
  }
}

runTests();
