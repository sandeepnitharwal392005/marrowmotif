const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });

  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  console.log('Navigated to:', page.url());
  
  // Go to clients page
  await page.goto('http://localhost:3000/dashboard/clients');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
