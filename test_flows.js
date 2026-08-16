const test = async () => {
  const baseUrl = 'http://localhost:4000/api';
  const request = async (method, path, body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    return { status: res.status, text };
  };

  let res = await request('POST', '/auth/login', { email: 'demo-guide@example.com', password: 'Demo123!' });
  const guideToken = JSON.parse(res.text).accessToken;
  console.log('--- Guide Referral (New User) ---');
  let ref1 = await request('POST', '/users/referrals', {
    customerName: 'Test Referral',
    whatsappNumber: '+1222333444',
  }, guideToken);
  console.log('Referral 1:', ref1.status, ref1.text);

  console.log('--- Guide Referral (Existing User) ---');
  let ref2 = await request('POST', '/users/referrals', {
    customerName: 'Test Referral',
    whatsappNumber: '+1222333444',
  }, guideToken);
  console.log('Referral 2:', ref2.status, ref2.text);

  res = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  const adminToken = JSON.parse(res.text).accessToken;
  const customerId = JSON.parse(ref1.text).customerId;
  
  console.log('--- Admin Create Picture Book ---');
  let adminPb = await request('POST', '/picture-books', {
    title: 'Admin Created PB',
    userId: customerId,
    deliveryPreference: 'HOME_DELIVERY'
  }, adminToken);
  console.log('Admin PB:', adminPb.status, adminPb.text.substring(0, 100));

};
test();
