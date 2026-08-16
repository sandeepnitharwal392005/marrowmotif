const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  // 1. Admin Login
  let res = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'Admin123!' });
  const adminToken = res.data.accessToken;

  // 2. Fetch books as admin
  res = await request('GET', '/picture-books', null, adminToken);
  console.log('Admin fetch:', res.status, res.data);

  // 3. User Login
  const user = await prisma.user.findFirst({ where: { role: 'END_USER' } });
  if (user) {
    res = await request('POST', '/auth/login', { email: user.email, password: 'User123!' });
    if(res.data && res.data.accessToken) {
       let userRes = await request('GET', '/picture-books', null, res.data.accessToken);
       console.log('User fetch:', userRes.status, userRes.data);
    }
  }
};
test().finally(() => prisma.$disconnect());
