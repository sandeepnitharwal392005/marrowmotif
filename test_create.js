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

  let res = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  const adminToken = JSON.parse(res.text).accessToken;

  res = await request('POST', '/picture-books', {
    title: 'New PB via Admin',
    userId: 'cmsw6mijd0003uquoulo8iuc9',
    deliveryPreference: 'HOME_DELIVERY'
  }, adminToken);
  
  console.log('Create PB:', res.status, res.text);
};
test();
