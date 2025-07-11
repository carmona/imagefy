const { createCanvas, loadImage } = require("canvas");
const { default: axios } = require("axios");
const sharp = require("sharp");
const puppeteer = require('puppeteer');
const { getMetaFromUrl } = require("./external.js");

async function getImageFromMeta (metadata, size) {
  const { title, description, image, author, provider, published } = metadata;
  const treated_author = author || provider;

  let width = 800;
  let height = 800;

  if (size) {
    const parts = size.split('x');
    if (parts.length === 2) {
      const parsedWidth = parseInt(parts[0], 10);
      const parsedHeight = parseInt(parts[1], 10);
      if (!isNaN(parsedWidth) && parsedWidth > 0 && !isNaN(parsedHeight) && parsedHeight > 0) {
        width = parsedWidth;
        height = parsedHeight;
      }
    }
  }

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  // Draw the background image
  try {
    const imageResponse = await axios.get(image, { responseType: 'arraybuffer' });
    const imageBuffer = await sharp(imageResponse.data).toFormat('png').toBuffer();
    const canvasImage = await loadImage(imageBuffer);
    
    // Scale image to fit width, maintaining aspect ratio
    const imageAspectRatio = canvasImage.width / canvasImage.height;
    let drawWidth = width;
    let drawHeight = drawWidth / imageAspectRatio;

    // If scaled height is less than canvas height, adjust to fit height (letterbox or crop top/bottom)
    // For this implementation, we'll ensure it covers the canvas, potentially cropping sides or fitting height
    if (drawHeight < height) {
        drawHeight = height;
        drawWidth = drawHeight * imageAspectRatio;
    }
    // Center the image
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    context.drawImage(canvasImage, offsetX, offsetY, drawWidth, drawHeight);

  } catch (err) {
    console.error("Error loading or drawing background image:", err);
    // Optionally draw a placeholder or fill with a color if image fails
    context.fillStyle = '#CCCCCC'; // Grey background if image fails
    context.fillRect(0, 0, width, height);
  }


  // Define the white block for text
  const textBlockHeight = Math.min(200, height * 0.25); // Max 200px or 25% of canvas height
  const textBlockY = height - textBlockHeight;

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, textBlockY, width, textBlockHeight);

  // Write the post title, description, and author's name in the white block
  context.fillStyle = '#000000';
  
  // Adjust font sizes based on canvas width/height for basic responsiveness
  const baseTitleSize = Math.max(20, Math.min(36, width / 25)); // Scale title font
  const baseDescSize = Math.max(16, Math.min(24, width / 35));  // Scale desc font
  const baseAuthorSize = Math.max(12, Math.min(18, width / 45)); // Scale author font

  context.font = `${baseTitleSize}px sans-serif`;
  context.fillText(title, 50, textBlockY + textBlockHeight * 0.3, width - 100); // Max width for text
  
  context.font = `${baseDescSize}px sans-serif`;
  context.fillText(description, 50, textBlockY + textBlockHeight * 0.6, width - 100);

  if(treated_author) {
    context.font = `${baseAuthorSize}px sans-serif`;
    context.fillText(treated_author, 50, textBlockY + textBlockHeight * 0.9, width - 100);
  }

  // Return the canvas as a buffer
  return canvas.toBuffer();
}


function getErrorCanvas (size) {
  // Default dimensions for error canvas, can be dynamic if needed
  let errorWidth = 800;
  let errorHeight = 800;
  if (size) { // Attempt to use requested size for error canvas too
      const parts = size.split('x');
      if (parts.length === 2) {
          const parsedWidth = parseInt(parts[0], 10);
          const parsedHeight = parseInt(parts[1], 10);
          if (!isNaN(parsedWidth) && parsedWidth > 0 && !isNaN(parsedHeight) && parsedHeight > 0) {
              errorWidth = parsedWidth;
              errorHeight = parsedHeight;
          }
      }
  }

  const canvas = createCanvas(errorWidth, errorHeight);
  const context = canvas.getContext("2d");
  context.fillStyle = '#CCCCCC'; // Use a different color for clarity
  context.fillRect(0, 0, errorWidth, errorHeight);
  context.fillStyle = '#FF0000';
  context.font = '36px sans-serif'; // Consider scaling this font too
  context.textAlign = 'center';
  context.fillText("Error Generating Image", errorWidth / 2, errorHeight / 2);
  return canvas;
}

async function createScreenshot(url, params) {
  let result_canvas;
  try {
    // Provide default lang and ua if not available from params
    const lang = params && params.lang ? params.lang : 'en-US';
    const ua = params && params.ua ? params.ua : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const metadata = await getMetaFromUrl(url, lang, ua);

    if (!metadata || !metadata.title || !metadata.image) {
      console.error("Missing metadata or essential fields.");
      // Pass the size to getErrorCanvas so it can attempt to match dimensions
      return getErrorCanvas(params && params.size ? params.size : undefined).toBuffer();
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 0; }
            img { width: 100%; height: auto; display: block; }
            .content { padding: 20px; }
            h1 { font-size: 28px; margin-bottom: 10px; }
            p { font-size: 18px; color: #555; }
          </style>
        </head>
        <body>
          <img src="${metadata.image}" alt="${metadata.title}" />
          <div class="content">
            <h1>${metadata.title}</h1>
            ${metadata.description ? `<p>${metadata.description}</p>` : ''}
          </div>
        </body>
      </html>
    `;

    
    // Determine viewport for Puppeteer based on params.size or defaults
    let puppeteerWidth = 800;
    let puppeteerHeight = 600; // Default, can be adjusted or made dynamic
    if (params && params.size) {
        const parts = params.size.split('x');
        if (parts.length === 2) {
            const pW = parseInt(parts[0], 10);
            const pH = parseInt(parts[1], 10);
            if (!isNaN(pW) && pW > 0 && !isNaN(pH) && pH > 0) {
                puppeteerWidth = pW;
                puppeteerHeight = pH; // Or calculate based on aspect ratio
            }
        }
    }


    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: puppeteerWidth, height: puppeteerHeight, deviceScaleFactor: 1 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const screenshotBuffer = await page.screenshot();
    await browser.close();

    return screenshotBuffer;

  } catch (error) {
    console.error("Error creating screenshot:", error);
    // Pass the size to getErrorCanvas
    return getErrorCanvas(params && params.size ? params.size : undefined).toBuffer();
  }
}

module.exports = { getImageFromMeta, createScreenshot, getErrorCanvas };
