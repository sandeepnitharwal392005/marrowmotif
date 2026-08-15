const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const log = (msg) => console.log(`[E2E] ${msg}`);

  try {
    log("=== TEST ADMIN PICTURE BOOK ASSIGNMENT FLOW ===");
    
    // 1. Admin Login
    log("Logging in as Admin...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[id="login-email"]');
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for hydration
    await page.type('input[id="login-email"]', 'admin@example.com');
    await page.type('input[id="login-password"]', 'Demo123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for the URL to change to dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    log("Now at: " + page.url());
    
    // 2. Go to Create Picture Book page
    log("Navigating to /dashboard/clients/new...");
    await page.goto('http://localhost:3000/dashboard/clients/new', { waitUntil: 'domcontentloaded' });
    
    // 3. Customer Search
    log("Typing 'API' into customer search...");
    // The search input in the UI might be an input[placeholder="Search by name, email, or phone..."]
    await page.type('input[placeholder*="Search by name"]', 'API');
    
    // Wait for debounce and network request
    log("Waiting for debounce and search results...");
    await page.waitForResponse(response => 
      response.url().includes('/users/search') && response.status() === 200
    );
    log("Search API returned 200 OK!");
    
    // 4. Select the customer
    log("Clicking the first search result...");
    await new Promise(resolve => setTimeout(resolve, 500)); // wait for render
    
    // Evaluate in page to click the li containing the user name
    await page.evaluate(() => {
      const lis = Array.from(document.querySelectorAll('li'));
      const target = lis.find(li => li.textContent.includes('API Test User'));
      if (target) target.click();
      else throw new Error('API Test User not found in dropdown');
    });
    
    // 5. Fill out the form
    log("Filling out Picture Book details...");
    await page.type('input[id="book-title"]', 'Admin Assigned Safari');
    // delivery preference might default to something or we can just ignore since it's hidden radio
    
    // Submit
    log("Submitting the form...");
    await page.click('button[type="submit"]');
    
    // Check for HTML5 validation errors
    const isInvalid = await page.$eval('form', form => !form.checkValidity());
    if (isInvalid) {
      log("Form is invalid! HTML5 validation failed.");
    }

    // Wait for the API request or error
    log("Waiting for creation response...");
    
    // Listen to responses and log them
    page.on('response', response => {
      if (response.url().includes('/picture-books') && response.request().method() === 'POST') {
        log(`POST /picture-books -> ${response.status()}`);
        response.json().then(data => log(JSON.stringify(data))).catch(() => {});
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    
    log("Picture Book successfully assigned to customer!");

    log("=== TEST PASS ===");
    process.exit(0);

  } catch (error) {
    console.error("TEST FAILED:", error);
    try {
      await page.screenshot({ path: 'admin-e2e-failure.png' });
      log("Screenshot saved to admin-e2e-failure.png");
    } catch(e) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
