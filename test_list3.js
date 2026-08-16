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

  let res = await request('POST', '/auth/login', { email: 'user@example.com', password: 'User123!' });
  const userToken = JSON.parse(res.text).accessToken;
  res = await request('GET', '/picture-books?page=1&limit=20', null, userToken);
  console.log('User fetch:', res.status, res.text.substring(0, 100));

  res = await request('POST', '/auth/login', { email: 'guide@example.com', password: 'Guide123!' });
  const guideToken = JSON.parse(res.text).accessToken;
  res = await request('GET', '/picture-books?page=1&limit=20', null, guideToken);
  console.log('Guide fetch:', res.status, res.text.substring(0, 100));
};
test();
