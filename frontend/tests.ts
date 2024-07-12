import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await browser.newPage();

    await page.goto('http://localhost:3000/login');

    await page.waitForTimeout(2000);

    await page.type('input[type=text]', 'Иван');

    const stockPercentageBefore = await page.$eval('#AAPLpercentage', (span) => span.textContent);

    console.log('======== BEFORE ========')
    console.log(stockPercentageBefore)

    await page.click('#trade');

    await page.waitForTimeout(1000);

    await page.click('#AAPLplusSell');

    await page.click('#AAPLsell');

    await page.click('#brokers');

    await page.waitForTimeout(1000);

    const stockPercentageAfter = await page.$eval('#AAPLpercentage', (span) => span.textContent);

    console.log('======== AFTER ========')
    console.log(stockPercentageAfter)

    await browser.close();
})