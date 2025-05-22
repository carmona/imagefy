# imagefy
A tool for sharing info from news pages as images

## Idea
This is supposed to be a case study for me to learn more about NodeJS and back-end code. 

Its main goal is to tackle an issue in developing countries where cellular data is restricted for web browsing while social media and messaging apps are not, and therefore the ability to share information through images (roughly 600kb each) on messaging apps would be much more affordable for people in these conditions.

## Method
I'm going to extract data from the given article URL such as title, description and main photo. These will then be passed on to a simple HTML page in a headless browser just for layout purposes, and then saved as an image and returned for download.

This functionality is implemented using Puppeteer, a Node library that provides a high-level API to control Chrome/Chromium over the DevTools Protocol. Ideally, this could later be changed into using a lib dedicated to building images if more direct image manipulation is needed beyond what a headless browser offers.
