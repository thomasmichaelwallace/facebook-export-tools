const fs = require('fs');
const puppeteer = require('puppeteer-core');

// note response from:
//  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
const BROWSER_WS = 'ws://127.0.0.1:9222/devtools/browser/c114f89b-b40f-412b-b18c-5d6fd3ca0c04';

const fbids = JSON.parse(fs.readFileSync('./tmp/fbid.json'));

// helpers
const randomDelay = () => new Promise((r) => setTimeout(r, Math.random() * 1000));

// script to run in page context
async function scraper() {
  const delay = () => new Promise((r) => setTimeout(r, 100));

  // eslint-disable-next-line no-undef
  const fbid = new URL(window.location.href).searchParams.get('fbid');

  do { // loop forever
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
    if (storyTag.length === 1) { // prefer exif time
      match = storyTag[0].match(/backdated_time":\{"time":([0-9]+)/);
    } else if (createdTag.length === 1) {
      match = createdTag[0].match(/created_time":([0-9]+)/);
    }
    if (match) {
      const date = Number.parseInt(match[1], 10) * 1000;
      if (!Number.isNaN(date)) return date;
    }

    await delay(); // eslint-disable-line no-await-in-loop
  } while (true); // eslint-disable-line no-constant-condition
}

// eslint-disable-next-line no-console
const log = (...t) => console.log(new Date(), '>', ...t);

async function main() {
  let state = {};
  if (fs.existsSync('./tmp/state.json')) state = JSON.parse(fs.readFileSync('./tmp/state.json'));

  log('connecting to', BROWSER_WS);
  const browser = await puppeteer.connect({ browserWSEndpoint: BROWSER_WS });
  log('spawning page');
  const page = await browser.newPage();

  const total = fbids.length;
  let line = 0;
  while (fbids.length) {
    line += 1;
    const fbid = fbids.shift();
    log('processing', line, '/', total);

    if (state[fbid]) {
      log('cached', fbid);
      continue; // eslint-disable-line no-continue
    }

    const url = `https://www.facebook.com/photo?fbid=${fbid}&set=pob.36702211`;
    /* eslint-disable no-await-in-loop */
    await page.goto(url);
    const date = await page.evaluate(scraper);
    await randomDelay();
    /* eslint-enable no-await-in-loop */

    log('got', fbid, new Date(date));
    if (state[fbid]) throw new Error(`double fbid: ${fbid}`);

    state[fbid] = date;
    fs.writeFileSync('./tmp/state.json', JSON.stringify(state, null, 2));
  }
  log('complete');
}
main();
