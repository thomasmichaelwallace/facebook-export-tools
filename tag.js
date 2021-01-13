const fs = require('fs');
const path = require('path');
const proc = require('child_process');

// fetcher functions

const dates = JSON.parse(fs.readFileSync('./tmp/state.json'));
function getTimestamp(fbid) {
  return dates[fbid];
}

const base = './output';
function getPathsAndIds() {
  const files = fs.readdirSync(base);
  const spec = files.map((f) => {
    const file = path.join(base, f);
    const fbid = path.basename(f, path.extname(f));
    return { file, fbid };
  });
  return spec;
}

// set functions

function setExifTimes(file, date) {
  // DateTimeOriginal -> YYYY:MM:DD HH:MM:SS
  const stamp = date.toISOString().replace(/-/g, ':').replace(/T/g, ' ').replace(/.\d\d\dZ$/, '');
  proc.execSync(`exiftool "-alldates=${stamp}" -overwrite_original ${file}`);
}

function setAttributeTimes(file, date) {
  // [[CC]YY]MMDDhhmm[.ss]
  const stamp = date.toISOString() // '2015-11-30T12:00:00.000Z'
    .replace(/[-T:]/g, '').replace(/(\d\d).\d\d\dZ$/, '.$1');
  proc.execSync(`touch -amt ${stamp} ${file}`);
}

function setTimes(file, ts) {
  const date = new Date(ts);
  setExifTimes(file, date);
  setAttributeTimes(file, date);
}

module.exports = { setTimes };

// main

function main() {
  /* eslint-disable no-console */
  const todo = getPathsAndIds();
  console.log(`~ ${todo.length} files to set ~`);
  todo.forEach(({ file, fbid }, i) => {
    const ts = getTimestamp(fbid);
    if (!ts) throw new Error(`No timestamp found for fbid ${fbid}`);
    console.log(`[${fbid}] (${i + 1}/${todo.length}) -> ${new Date(ts)}`);
    setTimes(file, ts);
  });
  /* eslint-enable no-console */
}
if (process.env.FB_RUN) main();
