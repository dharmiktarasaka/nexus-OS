const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store the Chrome binary inside the project directory so cloud hosts retain it
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
