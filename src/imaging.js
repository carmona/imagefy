const { createCanvas, loadImage } = require("canvas");
const { default: axios } = require("axios");
const sharp = require("sharp");

async function getImageFromMeta (metadata) {
  const { title, description, image, author, provider, published } = metadata;
  const treated_author = author || provider;
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

  if(treated_author) {
    context.font = '18px sans-serif';
    context.fillText(treated_author, 50, 750);
  }

  // Return the canvas as a buffer
  return canvas.toBuffer();
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

module.exports = { getImageFromMeta, createScreenshot, getErrorCanvas };
