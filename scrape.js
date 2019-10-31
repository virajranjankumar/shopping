const puppeteer = require('puppeteer-core');
const fs = require('fs');


async function luluhypermarket() {
    const url      = 'https://www.luluhypermarket.com/en-ae/grocery/c/HYGRCR00001?sort=discount-desc&q=%3Arelevance%3AisDiscount%3Atrue#'
    const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    let data = []
    for(let i = 0; i < 22; i++) {
        const temp = await parseLuluPage(page, url)
        data = data.concat(temp);
    }
    fs.writeFileSync('./deals/lulu.json', JSON.stringify(data, null, 2))
    console.dir(data.length);
    await browser.close();
}

async function parseLuluPage(page, url) {
    await page.goto(url);
    const temp = await page.evaluate(() => 
        gtm.dataLayerPlpImpression.ecommerce.impressions
    );
    if (document.querySelector('.pagination .active').nextElementSibling == null) {
        return temp;
    } else {
        const nextUrl = document.querySelector('.pagination .active').nextElementSibling.href
    }
    return temp;
}

async function carrefour() {
    const dealsUrl = 'https://www.carrefouruae.com/mafuae/en/online-deals/c/deals';
    const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    let data = []
    let bad = []
    for(let i = 0; i < 2; i++) {
        await page.goto(dealsUrl + "?&qsort=relevance&pg=" + i);
        const temp = await page.evaluate(() => 
            Array.from(document.querySelectorAll('a.js-gtmProdData[data-gtm-prod-data]'))
                .filter(i => {
                    try {
                        const t = JSON.parse(i.dataset.gtmProdData);
                        return true
                    } catch(e) {
                        return false
                    }
                })
                .map(i => {
                    const {
                        name, id, price, brand, category, list, dimension7,
                        dimension14, dimension18, dimension23, dimension26
                    } = JSON.parse(i.dataset.gtmProdData);
                    return {
                        name, id, brand, category, list, 
                        isFood: dimension7,
                        inStock: dimension14, 
                        color: dimension18, 
                        dimension23, 
                        date: dimension26,
                        price
                    }
                })
        )
        const tempBad = await page.evaluate(() => 
            Array.from(document.querySelectorAll('a.js-gtmProdData[data-gtm-prod-data]'))
            .filter(i => {
                try {
                    JSON.parse(i.dataset.gtmProdData);
                    return false
                } catch(e) {
                    return true
                }
            })
            .map(i => i.dataset.gtmProdData)
        )
        bad = bad.concat(tempBad)
        data = data.concat(temp)
    }
    fs.writeFileSync('./deals/carrefour.json', JSON.stringify(data, null, 2))
    console.dir(data.length)
    console.log("BAD")
    console.log(bad.join('\n\n'))
    console.log("?BAD")
    await browser.close();
}

// carrefour();
luluhypermarket();