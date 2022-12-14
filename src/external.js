const getMetaData = require('metadata-scraper');

async function getMetaFromUrl (encodedUrl, lang, ua) {
  const url = decodeURIComponent(encodedUrl);
  const options = {
      url,
      maxRedirects: 0, // Maximum number of redirects to follow (default: 5)
      ua, // Specify User-Agent header
      lang, // Specify Accept-Language header
      // timeout: 1000, // Request timeout in milliseconds (default: 10000ms)
      forceImageHttps: false, // Force all image URLs to use https (default: true)
      customRules: {} // more info below
  }
  const metadata = await getMetaData(options);

  return metadata;
}

module.exports = { getMetaFromUrl };
