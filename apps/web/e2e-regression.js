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
    await page.goto('http://localhost:3000/register');
    
    await page.type('input[name="name"]', 'Regression Test User');
    await page.type('input[name="email"]', email);
    await page.type('input[name="whatsappNumber"]', '+1234567890');
    await page.type('input[name="password"]', password);
    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.href.includes('/verify-otp') || window.location.href.includes('/login'), { timeout: 10000 });

    log("Successfully registered! Now at: " + page.url());
    if (!page.url().includes('/login') && !page.url().includes('/verify-otp')) {
      throw new Error("Registration did not redirect to login or OTP page.");
    }

    log("2. Testing Login Flow...");
    await page.goto('http://localhost:3000/login');
    await page.type('input[id="login-email"]', email);
    await page.type('input[id="login-password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.href.includes('/dashboard'), { timeout: 10000 });

    log("Successfully logged in! Now at: " + page.url());
    if (!page.url().includes('/dashboard')) {
      throw new Error("Login did not redirect to dashboard.");
    }

    log("3. Create Picture Book...");
    await page.goto('http://localhost:3000/dashboard/clients/new');
    await page.type('input[id="book-title"]', 'My Safari Trip');
    // For HOME_DELIVERY the radio button is already checked by default
    
    // addressOption defaults to CUSTOM because the new test user has no address
    // Wait for the custom address fields to be visible
    await page.waitForSelector('input[value="123 E2E St"]', { timeout: 1000 }).catch(async () => {
        // If not found, type them
        const addressInputs = await page.$$('input[required]');
        // The first required input is the title, so we need to target specifically
        // Since they don't have IDs or names in the new UI, we can use their labels or just evaluate
    });
    
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const getByLabel = (labelText) => {
            const labels = Array.from(document.querySelectorAll('label'));
            const label = labels.find(l => l.textContent.includes(labelText));
            if (!label) return null;
            return label.nextElementSibling; // the input
        };
        const titleInput = document.querySelector('input[id="book-title"]');
        const addr1 = getByLabel('Address Line 1');
        const city = getByLabel('City');
        const state = getByLabel('State/Province');
        const zip = getByLabel('Postal Code');
        const country = getByLabel('Country');
        
        if (addr1) {
            addr1.value = '123 E2E St';
            addr1.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (city) {
            city.value = 'Testville';
            city.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (state) {
            state.value = 'CA';
            state.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (zip) {
            zip.value = '90210';
            zip.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (country) {
            country.value = 'USA';
            country.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.href.includes('/dashboard/clients/'), { timeout: 10000 });

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
    await page.goto('http://localhost:3000/login');
    await page.type('input[id="login-email"]', 'admin@example.com');
    await page.type('input[id="login-password"]', 'Demo123!');
    
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.href.includes('/dashboard'), { timeout: 10000 });
    
    log("6. Admin accessing specific Picture Book...");
    await page.goto(pictureBookUrl);
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
