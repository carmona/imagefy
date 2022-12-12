const { createCanvas, loadImage } = require("canvas");
const { default: axios } = require("axios");
const express = require('express');
const getMetaData = require('metadata-scraper')
const sharp = require("sharp");

const server = express();
const port = 5000;

process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
  // any clean-up goes here
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

server.get('/link-meta/:encodedUrl', async (req, res) => {
  const language = req.get('accept-language') || 'en-US';
  const ua = req.get('user-agent') || 'Imagefy';
  const metadata = await getMetaFromUrl(req.params.encodedUrl, language, ua);

  res.json(metadata);
});

server.get('/link-preview/:encodedUrl', async (req, res) => {
  // console.info('headers: ', req.headers);
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

  res.writeHead(
    200,
    //this is the headers object
    {
      //content-type: image/jpg tells the browser to expect an image
      "Content-Type": "image/jpg",
    }
  );

  //ending the response by sending the image buffer to the browser
  res.end(image);
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});


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

async function getImageFromMeta (metadata) {
  const { title, description, image, author, provider, published } = metadata;
  author = author || provider;
  const dimensions = {
    width: 800,
    height: 800,
  };
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const context = canvas.getContext("2d");

  // draw the image
  const imageResponse = await axios.get(image, { responseType: 'arraybuffer' });
  const myImage = await sharp(imageResponse.data).toFormat('png').toBuffer();
  const canvasImage = await loadImage(myImage);
  context.drawImage(canvasImage, 0, 0);

  // Draw a white block at the bottom of the canvas
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 600, 800, 200);

  // Write the post title, description, and author's name in the white block
  context.fillStyle = '#000000';
  context.font = '36px sans-serif';
  context.fillText(title, 50, 650);
  context.font = '24px sans-serif';
  context.fillText(description, 50, 700);

  if(author) {
    context.font = '18px sans-serif';
    context.fillText(author, 50, 750);
  }

  // Return the canvas as a buffer
  return canvas.toBuffer();
}

function generateUrlWithParams(url, params) {
  const urlObj = new URL(url);
  Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
  return urlObj.toString();
}

function getErrorCanvas () {
  const dimensions = {
    width: 800,
    height: 800,
  };
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const context = canvas.getContext("2d");
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, 800, 800);
  context.fillStyle = '#FF0000';
  context.font = '36px sans-serif';
  context.fillText("error", 50, 650);
  return canvas;
}

async function createScreenshot(url, params) {
  let result_canvas;
  result_canvas = getErrorCanvas();
  // TODO: add screenshot
  return result_canvas.toBuffer();
}
