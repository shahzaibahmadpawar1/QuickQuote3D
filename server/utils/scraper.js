const cheerio = require('cheerio');
const axios = require('axios');

async function scrapeProduct(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    const $ = cheerio.load(data);

    // Heuristics for common meta tags (OpenGraph)
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const image = $('meta[property="og:image"]').attr('content') || '';

    // Price is tricky, usually site-specific. We'll try common selectors or regex.
    // This is a naive implementation.
    let price = 0;
    const bodyText = $('body').text();
    const priceRegex = /[\$£€](\d+(?:,\d+)*(?:\.\d{2})?)/;
    const priceMatch = bodyText.match(priceRegex);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    return {
      name: title.trim(),
      thumbnailUrl: image,
      price: price || 0,
      sourceLink: url
    };
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw new Error('Failed to scrape product data');
  }
}

module.exports = { scrapeProduct };
