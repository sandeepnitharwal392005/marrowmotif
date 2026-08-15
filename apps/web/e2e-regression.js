const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const log = (msg) => console.log(`[E2E] ${msg}`);
  const uniqueId = Date.now();
  const email = `test_user_${uniqueId}@example.com`;
  const password = "Password123!";

  try {
    log("=== STARTING FULL REGRESSION TEST ===");
    
    // ----------------------------------------------------
    // 1. PUBLIC & END USER FLOW
    // ----------------------------------------------------
    log("1. Testing Registration Flow...");
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0' });
    
    await page.type('input[name="name"]', 'Regression Test User');
    await page.type('input[name="email"]', email);
    await page.type('input[name="phone"]', '+1234567890');
    await page.type('input[name="password"]', password);
    // Submit registration
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    log("Successfully registered! Now at: " + page.url());
    if (!page.url().includes('/login')) {
      throw new Error("Registration did not redirect to login page.");
    }

    log("2. Testing Login Flow...");
    await page.type('input[id="login-email"]', email);
    await page.type('input[id="login-password"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    log("Successfully logged in! Now at: " + page.url());
    if (!page.url().includes('/dashboard')) {
      throw new Error("Login did not redirect to dashboard.");
    }

    log("3. Create Picture Book...");
    await page.goto('http://localhost:3000/dashboard/clients/new', { waitUntil: 'networkidle0' });
    await page.type('input[name="title"]', 'My Safari Trip');
    await page.select('select[name="deliveryPreference"]', 'HOME_DELIVERY');
    await page.type('input[name="deliveryAddressLine1"]', '123 E2E St');
    await page.type('input[name="deliveryCity"]', 'Testville');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    log("Picture Book created. URL: " + page.url());
    if (!page.url().includes('/dashboard/clients/')) {
      throw new Error("Picture Book creation did not redirect to details page.");
    }
    
    const pictureBookUrl = page.url();
    
    // Test Refreshing
    log("4. Testing Refresh Persistence...");
    await page.reload({ waitUntil: 'networkidle0' });
    const contentAfterRefresh = await page.content();
    if (!contentAfterRefresh.includes('My Safari Trip')) {
      throw new Error("Picture Book data lost after refresh.");
    }
    
    log("Logging out End User...");
    // Clear cookies/localStorage to simulate logout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    
    // ----------------------------------------------------
    // 2. ADMIN FLOW
    // ----------------------------------------------------
    log("5. Testing Admin Flow...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await page.type('input[id="login-email"]', 'admin@example.com');
    await page.type('input[id="login-password"]', 'Demo123!');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    log("6. Admin accessing specific Picture Book...");
    await page.goto(pictureBookUrl, { waitUntil: 'networkidle0' });
    const adminContent = await page.content();
    
    if (!adminContent.includes('My Safari Trip')) {
      throw new Error("Admin cannot see the End User's Picture Book.");
    }
    
    log("=== REGRESSION TEST PASS ===");
    process.exit(0);

  } catch (error) {
    console.error("TEST FAILED:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
