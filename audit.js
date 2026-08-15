const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR = "C:\\Users\\user\\.gemini\\antigravity\\brain\\d2662325-d9cd-4df1-8ae1-8aff1aa61145\\screenshots";
const BASE_URL = 'http://localhost:3000';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();

  // Helper to take screenshots
  async function snap(name) {
    await sleep(500); // Give React time to render
    const outPath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${name}.png`);
  }

  try {
    // 1. Public Home
    console.log("Visiting Home...");
    await page.goto(BASE_URL);
    await snap('01_Home');

    // 2. Public Products
    console.log("Visiting Products...");
    await page.goto(`${BASE_URL}/products`);
    await snap('02_Products_Public');

    // 3. Login
    console.log("Visiting Login...");
    await page.goto(`${BASE_URL}/login`);
    await snap('03_Login');

    // Fill login form (Assume admin credentials or we need to register first?)
    // Let's try to login as test admin, or wait, I need to know the credentials.
    // In many of these templates, admin@example.com / password works. Let's try.
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    
    if (page.url().includes('dashboard')) {
        console.log("Logged in as Admin successfully.");
        await snap('04_Admin_Dashboard');
        
        await page.goto(`${BASE_URL}/dashboard/users`);
        await snap('05_Admin_Users');
        
        await page.goto(`${BASE_URL}/dashboard/products`);
        await snap('06_Admin_Products');

        await page.goto(`${BASE_URL}/dashboard/products/new`);
        await snap('07_Admin_Products_New');
        
        await page.goto(`${BASE_URL}/dashboard/incidents`);
        await snap('08_Admin_Incidents');
    } else {
        console.log("Could not login with default admin credentials. URL is: " + page.url());
        await snap('03_Login_Failed');
    }

  } catch (err) {
    console.error("Error during puppeteer execution:", err);
  } finally {
    await browser.close();
  }
}

run();
