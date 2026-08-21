const test = async () => {
  const baseUrl = 'https://api-production-debe.up.railway.app/api';
  
  const request = async (method, path, body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = text; }
    return { status: res.status, data };
  };

  console.log('1. Logging in as admin...');
  const loginRes = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.data);
    return;
  }
  const token = loginRes.data.accessToken;
  console.log('✅ Logged in successfully!');

  // For a synthetic test, we want to trigger the special synthetic path in the worker.
  // The worker checks: if (pictureBook.user.email === 'production-test@marrowotif.internal')
  // Let's create a user if it doesn't exist.
  let testUserId;
  const usersRes = await request('GET', '/users?limit=100', null, token);
  if (usersRes.status === 200) {
    const testUser = usersRes.data.data.find(u => u.email === 'production-test@marrowotif.internal');
    if (testUser) {
      testUserId = testUser.id;
    }
  }

  if (!testUserId) {
    console.log('Creating synthetic test user...');
    // We might not have an endpoint to create a user directly via admin, but let's try register.
    const regRes = await request('POST', '/auth/register', { 
      name: 'Synthetic Test', 
      email: 'production-test@marrowotif.internal', 
      password: 'TestPassword123!',
      phone: '+15550000000'
    });
    if (regRes.status !== 201 && regRes.status !== 200) {
      console.log('Registration failed, might already exist:', regRes.data);
    }
    
    const usersRes2 = await request('GET', '/users?limit=100', null, token);
    const testUser2 = usersRes2.data.data.find(u => u.email === 'production-test@marrowotif.internal');
    if (testUser2) testUserId = testUser2.id;
  }

  if (!testUserId) {
    console.error('Could not get test user id.');
    return;
  }

  console.log(`2. Creating PictureBook for user ${testUserId}...`);
  const pbRes = await request('POST', '/picture-books', {
    title: '[SYNTHETIC] Test Drive Generation',
    userId: testUserId,
    deliveryPreference: 'HOME_DELIVERY'
  }, token);

  if (pbRes.status !== 201) {
    console.error('Failed to create PictureBook:', pbRes.data);
    return;
  }

  const pbId = pbRes.data.id;
  console.log(`✅ Created PictureBook: ${pbId}`);
  console.log(`AutomationJob should be QUEUED.`);

  // Poll for status
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000));
    
    const statusRes = await request('GET', `/picture-books/${pbId}`, null, token);
    if (statusRes.status === 200) {
      const book = statusRes.data;
      console.log(`\nPoll ${attempts}:`);
      console.log(`  - Drive Status: ${book.driveStatus}`);
      console.log(`  - Jobs:`, book.automationJobs?.map(j => `${j.automationType}: ${j.status}`).join(', '));
      
      if (book.driveStatus === 'SUCCESS' || book.driveStatus === 'FAILED') {
        console.log(`\n🎉 End state reached: ${book.driveStatus}`);
        break;
      }
    }
  }
};
test();
