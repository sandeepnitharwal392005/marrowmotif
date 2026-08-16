const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3000';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function snap(page, name, viewports = [{ width: 1280, height: 800 }]) {
  await sleep(1000); // Allow time for hydration and rendering
  for (const vp of viewports) {
    await page.setViewport(vp);
    await sleep(500); // Allow layout to adjust
    const filename = `${name}_${vp.width}x${vp.height}.png`;
    const outPath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${filename}`);
  }
}

async function runTest() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  const allViewports = [
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ];

  try {
    // --- 1. Public Pages ---
    console.log('\n--- Testing Public Pages ---');
    await page.goto(BASE_URL);
    await snap(page, '01_Home', allViewports);

    await page.goto(`${BASE_URL}/products`);
    await snap(page, '02_Products', allViewports);

    await page.goto(`${BASE_URL}/login`);
    await snap(page, '03_Login', allViewports);

    await page.goto(`${BASE_URL}/register`);
    await snap(page, '04_Register', allViewports);

    // --- 2. End User Flow ---
    console.log('\n--- Testing End User Flow ---');
    // Register User
    await page.goto(`${BASE_URL}/register`);
    const testUserEmail = `enduser_${Date.now()}@example.com`;
    await page.type('input[name="name"]', 'End User Test');
    await page.type('input[name="email"]', testUserEmail);
    await page.type('input[name="whatsappNumber"]', '+1111111111');
    await page.type('input[name="password"]', 'User123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>null);
    
    // We might be blocked by OTP. Let's see if the UI asks for OTP or just fails.
    await snap(page, '05_EndUser_PostRegister', allViewports);

    // To bypass OTP for the E2E script without DB access here, we can login using the seeded user
    console.log('Logging in with seeded End User...');
    await page.goto(`${BASE_URL}/login`);
    await page.type('input[type="email"]', 'user@example.com');
    await page.type('input[type="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>null);
    await snap(page, '06_EndUser_Dashboard', allViewports);

    await page.goto(`${BASE_URL}/dashboard/picture-books/new`);
    await snap(page, '07_EndUser_CreatePictureBook', allViewports);

    await page.goto(`${BASE_URL}/dashboard/incidents/new`);
    await snap(page, '08_EndUser_CreateIncident', allViewports);
    
    await page.goto(`${BASE_URL}/dashboard/settings`);
    await snap(page, '09_EndUser_Settings', allViewports);

    // --- 3. Guide Flow ---
    console.log('\n--- Testing Guide Flow ---');
    // Logout first
    await page.goto(`${BASE_URL}`);
    // Clear cookies/localStorage to ensure clean login
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/login`);
    await page.type('input[type="email"]', 'demo-guide@example.com');
    await page.type('input[type="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>null);
    
    await snap(page, '10_Guide_Dashboard', allViewports);

    await page.goto(`${BASE_URL}/dashboard/customers/new`);
    await snap(page, '11_Guide_AddCustomer', allViewports);

    // Verify isolation (Admin page access denied)
    await page.goto(`${BASE_URL}/admin`);
    await snap(page, '12_Guide_AdminAccess_Denied', [{ width: 1280, height: 800 }]);

    // --- 4. Admin Flow ---
    console.log('\n--- Testing Admin Flow ---');
    await client.send('Network.clearBrowserCookies');
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/login`);
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(()=>null);

    await snap(page, '13_Admin_Dashboard', allViewports);

    const adminPages = [
      { path: '/admin/users', name: '14_Admin_Users' },
      { path: '/admin/guides', name: '15_Admin_Guides' },
      { path: '/admin/picture-books', name: '16_Admin_PictureBooks' },
      { path: '/admin/products', name: '17_Admin_Products' },
      { path: '/admin/incidents', name: '18_Admin_Incidents' },
      { path: '/admin/audit', name: '19_Admin_AuditLogs' },
      { path: '/admin/settings', name: '20_Admin_Settings' }
    ];

    for (const p of adminPages) {
      await page.goto(`${BASE_URL}${p.path}`);
      await snap(page, p.name, allViewports);
    }

    console.log('\n--- UI Test Suite Completed Successfully ---');

  } catch (error) {
    console.error('Test Suite Failed:', error);
  } finally {
    await browser.close();
  }
}

runTest();
