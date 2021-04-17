/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { setTimes } = require('./tag');

const base = './facebook';

function getAlbumMeta() {
  const album = path.join(base, 'photos_and_videos', 'album');
  const files = fs.readdirSync(album);
  return files.map((f) => {
    const file = path.join(base, 'photos_and_videos', 'album', f);
    return JSON.parse(fs.readFileSync(file));
  });
}

function applyMeta(meta) {
  /* eslint-disable no-console */
  const { name, photos } = meta;

  console.log(`[album] ${name}`);

  photos.forEach(({ uri, creation_timestamp }) => { // eslint-disable-line camelcase
    const file = path.join(base, uri);
    if (!fs.existsSync(file)) return; // not all files updated

    const ts = creation_timestamp * 1000; // eslint-disable-line camelcase
    console.log(`[file] ${uri} ${new Date(ts)}`);
    setTimes(file, ts);
  });
  /* eslint-enable no-console */
}

function main() {
  const meta = getAlbumMeta();
  meta.forEach((m) => applyMeta(m));
}
main();
