const fs = require('fs');
const { createScreenshot, getErrorCanvas } = require('./src/imaging.js');

async function runTest() {
  console.log("Starting test for createScreenshot...");
  const testUrl = 'https://g1.globo.com/economia/noticia/2025/05/22/iof-o-que-e-o-imposto-sobre-operacoes-financeiras-e-quem-paga.ghtml'; // Reverted to example.com
  // Encode the URL to mimic how it would be passed in a real scenario
  const encodedTestUrl = encodeURIComponent(testUrl);

  try {
    const screenshotBuffer = await createScreenshot(encodedTestUrl);

    if (Buffer.isBuffer(screenshotBuffer) && screenshotBuffer.length > 0) {
      console.log("Test successful: Buffer received.");

      // Optional: Save the screenshot to a file for manual verification
      fs.writeFileSync('test_screenshot.png', screenshotBuffer);
      console.log("Screenshot saved to test_screenshot.png");

      // For example.com, we expect the error canvas due to missing image metadata
      const errorBuffer = getErrorCanvas().toBuffer();
      if (screenshotBuffer.equals(errorBuffer)) {
        console.log("Test passed: Received the error canvas image as expected for example.com.");
      } else {
        console.error("Test failed: Did not receive the error canvas image for example.com.");
        // Optionally, save the unexpected screenshot for inspection
        // fs.writeFileSync('unexpected_example_screenshot.png', screenshotBuffer);
      }

    } else {
      console.error("Test failed: Did not receive a valid Buffer for example.com.");
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTest();
