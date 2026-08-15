const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("=== STARTING END-TO-END TEST ===");
    
    // 1. Register a new End User
    console.log("1. Registering new End User...");
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0' });
    
    const uniqueId = Date.now();
    const email = `e2e_${uniqueId}@example.com`;
    
    await page.type('input[name="name"]', 'E2E Test User');
    await page.type('input[name="email"]', email);
    await page.type('input[name="phone"]', '1234567890');
    await page.type('input[name="password"]', 'password123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log("User registered successfully. Re-routing to Login...");

    // Now log in as the user
    console.log("Logging in as End User...");
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', 'password123');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // 2. Dashboard - Create Picture Book
    console.log("2. Navigating to Create Picture Book...");
    await page.goto('http://localhost:3000/dashboard/clients/new', { waitUntil: 'networkidle0' });

    // Fill form
    await page.type('input[name="title"]', 'My E2E Vacation Book');
    await page.select('select[name="deliveryPreference"]', 'HOME_DELIVERY');
    await page.type('input[name="deliveryAddressLine1"]', '123 Test St');
    await page.type('input[name="deliveryCity"]', 'Test City');
    
    console.log("Submitting Create Picture Book form...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    console.log("Picture Book Created Successfully!");
    
    // Log out
    console.log("Logging out...");
    // Assuming there's a logout button, or just clear cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    
    // 3. Admin Login
    console.log("3. Logging in as Admin...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Using a known admin account
    await page.type('input[name="email"]', 'admin@morrowotif.com');
    await page.type('input[name="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    console.log("Admin logged in. Looking for created Picture Book...");
    
    // Look at Admin Dashboard Recent Books
    const content = await page.content();
    if (content.includes('My E2E Vacation Book')) {
      console.log("SUCCESS: End User's Picture Book is visible to Admin!");
    } else {
      console.log("FAIL: Picture Book not found on Admin Dashboard.");
    }

    console.log("=== END-TO-END TEST COMPLETED ===");
  } catch (error) {
    console.error("TEST FAILED:", error);
  } finally {
    await browser.close();
  }
})();
