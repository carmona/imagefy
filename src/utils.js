
function generateUrlWithParams(url, params) {
  const urlObj = new URL(url);
  Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
  return urlObj.toString();
}

module.exports = { generateUrlWithParams };
