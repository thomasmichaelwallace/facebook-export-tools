const fs = require('fs');
const puppeteer = require('puppeteer-core');
const { setTimes } = require('./tag');

// note response from:
//  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
const BROWSER_WS = 'ws://127.0.0.1:9222/devtools/browser/__UUID__';

// helpers
const randomDelay = () => new Promise((r) => setTimeout(r, Math.random() * 3000 + 1000));

// script to run in page context
async function scraper() {
  // preamble
  function minMatch(tags, re) {
    const min = tags.reduce((m, t) => {
      const match = t.match(re);
      if (!match) return m;
      const date = Number.parseInt(match[1], 10) * 1000;
      if (Number.isNaN(date)) return m;
      return m === -1 ? date : Math.min(m, date);
    }, -1);
    return min === -1 ? undefined : min;
  }
  const delay = () => new Promise((r) => setTimeout(r, 100));

  let attempt = 0;
  do { // loop forever
    attempt += 1;

    // eslint-disable-next-line no-undef
    const fbid = new URL(window.location.href).searchParams.get('fbid');
    // eslint-disable-next-line no-undef
    const scripts = [...window.document.getElementsByTagName('script')];
    // loaded
    if (!scripts.length) continue; // eslint-disable-line no-continue

    // created always exists
    const createdTag = scripts
      .filter((s) => ['"__typename":"Photo"', 'created_time', fbid].every((t) => s.text.includes(t)))
      .map((s) => s.text);
    // backdated by exif _might_ exist
    const storyTag = scripts
      .filter((s) => ['backdated_time":'].every((t) => s.text.includes(t)))
      .map((s) => s.text);

    let match;
    if (storyTag.length >= 1) { // prefer exif time
      match = minMatch(storyTag, /backdated_time":\{"time":([0-9]+)/);
    } else if (createdTag.length >= 1) {
      match = minMatch(createdTag, /created_time":([0-9]+)/);
    }
    if (match) return match;

    await delay(); // eslint-disable-line no-await-in-loop
  } while (attempt < 500); // eslint-disable-line no-constant-condition

  throw new Error('Maximum attempts reached');
}

// eslint-disable-next-line no-console
const log = (...t) => console.log(new Date(), '>', ...t);

async function main() {
  log('connecting to', BROWSER_WS);
  const browser = await puppeteer.connect({ browserWSEndpoint: BROWSER_WS, defaultViewport: null });
  log('spawning page');
  const page = await browser.newPage();

  const base = './facebook/photos_and_videos/your_posts';
  const files = fs.readdirSync(base);

  while (files.length) {
    const file = files.shift();

    log('processing', file);

    let fbid = file.split('_');
    fbid = fbid[fbid.length - 1];
    ([fbid] = fbid.split('.'));

    const url = `https://www.facebook.com/photo?fbid=${fbid}&set=pob.36702211`;
    /* eslint-disable no-await-in-loop */
    await page.goto(url);
    const date = await page.evaluate(scraper);
    await randomDelay();
    /* eslint-enable no-await-in-loop */

    log('got', fbid, new Date(date));
    setTimes(`${base}/${file}`, date);
  }
  log('complete');
}
main();
