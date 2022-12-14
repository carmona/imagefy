const express = require('express');
const { getMetaFromUrl } = require('./external');
const { getImageFromMeta, createScreenshot } = require('./imaging');

const server = express();

server.get('/link-meta/:encodedUrl', async (req, res) => {
  const language = req.get('accept-language') || 'en-US';
  const ua = req.get('user-agent') || 'Imagefy';
  const metadata = await getMetaFromUrl(req.params.encodedUrl, language, ua);
  
  res.json(metadata);
});

server.get('/link-preview/:size/:encodedUrl', async (req, res) => {
  const language = req.get('accept-language') || 'en-US';
  const ua = req.get('user-agent') || 'Imagefy';
  const metadata = await getMetaFromUrl(req.params.encodedUrl, language, ua);
  
  const image = await getImageFromMeta(metadata);
  
  res.writeHead(200, {
    "Content-Type": "image/jpg",
  });
  
  //ending the response by sending the image buffer to the browser
  res.end(image);
});

server.get('/link-screenshot/:encodedUrl', async (req, res) => {
  const encodedUrl = req.params.encodedUrl;
  const url = decodeURIComponent(encodedUrl);
  console.info('getting screenshot: ', url);
  
  const image = await createScreenshot(url);
  
  res.writeHead(200, {
    "Content-Type": "image/jpg",
  });
  
  res.end(image);
});

module.exports = { server };
