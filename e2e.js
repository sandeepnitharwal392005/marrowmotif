const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const test = async () => {
  const baseUrl = 'http://localhost:4000/api';
  
  const request = async (method, path, body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    } catch (e) {
      return { status: 500, error: e.message };
    }
  };

  const log = (msg, res) => {
    console.log(`[${res.status}] ${msg}`);
    if (res.status >= 400) console.log(res.data || res.error);
  };

  console.log('--- STARTING E2E API VERIFICATION ---');

  // 1. Test Unauthenticated Access
  let res = await request('GET', '/users');
  log('GET /users (unauth) should be 401', res);
  if (res.status !== 401) throw new Error('Unauth check failed');

  // 2. Admin Login
  res = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  log('Admin Login', res);
  const adminToken = res.data.accessToken;
  if (!adminToken) throw new Error('Admin login failed');

  // 3. Admin creates Guide
  const guideEmail = `guide_${Date.now()}@test.com`;
  res = await request('POST', '/users/guides', { name: 'New Guide', email: guideEmail, whatsappNumber: '+123456' }, adminToken);
  log('Create Guide', res);
  if (res.status !== 201) throw new Error('Guide creation failed');
  const newGuideId = res.data.userId;

  // 4. End User Registration
  const userEmail = `user_${Date.now()}@test.com`;
  res = await request('POST', '/users', { name: 'End User', email: userEmail, password: 'User123!', whatsappNumber: '+987654' });
  log('Register User', res);
  if (res.status !== 201) throw new Error('User registration failed');

  // Fetch OTP from DB
  const userDb = await prisma.user.findUnique({ where: { email: userEmail } });
  const otpCode = userDb.otpCode;
  
  // Verify OTP
  res = await request('POST', '/users/verify-otp', { email: userEmail, otpCode });
  log('Verify OTP', res);
  if (res.status !== 201) throw new Error('OTP verification failed');

  // 5. User Login
  res = await request('POST', '/auth/login', { email: userEmail, password: 'User123!' });
  log('Login User (after OTP)', res);
  const userToken = res.data.accessToken;
  if (!userToken) throw new Error('User login failed');

  // 6. User creates Picture Book
  res = await request('POST', '/picture-books', { title: 'My Awesome Trip', deliveryPreference: 'HOME_DELIVERY' }, userToken);
  log('Create Picture Book', res);
  if (res.status !== 201) throw new Error('Picture book creation failed');
  const pbId = res.data.id;

  // 7. Admin updates Picture Book status
  res = await request('PATCH', `/picture-books/${pbId}/status`, { status: 'IN_PRODUCTION' }, adminToken);
  log('Admin Update PB Status', res);
  if (res.status !== 200) throw new Error('Status update failed');

  // 8. Admin triggers Drive Link creation
  res = await request('POST', `/picture-books/${pbId}/drive`, {}, adminToken);
  log('Admin Trigger Drive Generation', res);
  if (res.status !== 200) throw new Error('Drive generation failed');

  // 9. Wait for worker to process
  console.log('Waiting 3 seconds for worker...');
  await new Promise(r => setTimeout(r, 3000));

  // 10. Check if driveLink was created
  res = await request('GET', `/picture-books/${pbId}`, null, adminToken);
  log('Get PB', res);
  if (!res.data.driveLink) throw new Error('Worker failed to generate driveLink');
  
  console.log('--- E2E API VERIFICATION PASSED ---');
};

test().catch(e => {
  console.error('--- E2E VERIFICATION FAILED ---');
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
