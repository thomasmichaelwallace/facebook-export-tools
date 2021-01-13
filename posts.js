/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { setTimes } = require('./tag');

const base = './facebook';

function getPosts() {
  const file = path.join('./facebook/posts/your_posts_1.json');
  const posts = JSON.parse(fs.readFileSync(file));
  return posts;
}

function parsePost(post) {
  const { attachments } = post;
  if (!attachments) return;

  attachments.forEach((a) => {
    // is post attachment
    const data = (a.data || {});
    data.forEach((d) => {
      const { media } = d;
      if (!media || !media.uri) return;
      const { uri } = media;

      // is not described elsewhere
      if (!uri.includes('/your_posts/')) return;
      const file = path.join(base, uri);
      if (!fs.existsSync(file)) return; // not all files updated

      // prefer media timestamp
      let ts = ((media.media_metadata || {}).photo_metadata || {}).taken_timestamp
        || media.creation_timestamp;
      ts *= 1000;

      // eslint-disable-next-line no-console
      console.log(`[file] ${uri} ${new Date(ts)}`);
      setTimes(file, ts);
    });
  });
}

function main() {
  const posts = getPosts();
  posts.forEach((p) => parsePost(p));
}
main();
