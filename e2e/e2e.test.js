import puppetteer from 'puppeteer';
import { fork } from 'child_process';

jest.setTimeout(30000); // default puppeteer timeout

describe('Credit Card Validator form', () => {
  let browser = null;
  let page = null;
  let server = null;
  const validCoords = [
    ['51.50851, -0.12572', '[51.50851, -0.12572]'],
    ['51.50851,  -0.12572', '[51.50851, -0.12572]'],
    ['51.50851,-0.12572', '[51.50851, -0.12572]'],
  ];

  const invalidCoords = [
    ['s.50851, -0.12572]'],
    ['[51.50851, -0.12572]'], 
    ['[51.50851, -0.12572]'], 
    ['51.50851, -'], 
    ['51.50851, -181'], 
    ['51.50851, 181'], 
    ['-90.50851, 15'], 
    ['90.50851, 15'],
  ];

  const testValidCoords = test.each(validCoords);
  const testInvalidCoords = test.each(invalidCoords);
  
  const baseUrl = 'http://localhost:9000';

  beforeAll(async () => {
    server = fork(`${__dirname}/e2e.server.js`);
    await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.on('message', (message) => {
        if (message === 'ok') {
          resolve();
        }
      });
    });

    browser = await puppetteer.launch({
      headless: true,
    });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(baseUrl, []);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    server.kill();
  });

  testInvalidCoords(
    'After input coordinates %s, a validation error (custom error) should occur',
    async (inputText) => {
      await page.goto(baseUrl);
      const messageInput = await page.waitForSelector('.timeline-editor-form-text_input');
      await messageInput.type('test');
      await messageInput.press('Enter');
      const modal = await page.waitForSelector('.modal-container');
      const coordsInput = await modal.waitForSelector('.modal-input');
      const submitBtn = await modal.waitForSelector('.modal-controls-confirm_button');
      await coordsInput.type(inputText);
      await submitBtn.click();
      const isModalVisible = await modal.isVisible();
      expect(isModalVisible).toBeTruthy();
      const validityCustomError = await modal.$eval('.modal-input', (el) => el.validity.customError);
      expect(validityCustomError).toBeTruthy();
    },
  );

  testValidCoords(
    'After input coordinates %s, the modal window closes and a message appears with these coordinates', 
    async (inputText, expected) => {
      await page.goto(baseUrl);
      const messageInput = await page.waitForSelector('.timeline-editor-form-text_input');
      await messageInput.type(inputText);
      await messageInput.press('Enter');
      const modal = await page.waitForSelector('.modal-container');
      const coordsInput = await modal.waitForSelector('.modal-input');
      const submitBtn = await modal.waitForSelector('.modal-controls-confirm_button');
      await coordsInput.type(inputText);
      await submitBtn.click();
      const isModalVisible = await modal.isVisible();
      expect(isModalVisible).toBeFalsy();
      const message = await page.waitForSelector('.timeline-message');
      const messageContent = await message.$eval('.timeline-message-content', (el) => el.textContent);
      expect(messageContent).toBe(inputText);
      const messageLocationContent = await message.$eval(
        '.timeline-message-footer-location',
        (el) => el.textContent,
      );
      expect(messageLocationContent).toBe(expected);
    },
  );
});
