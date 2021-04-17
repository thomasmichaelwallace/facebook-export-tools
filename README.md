# Facebook Export Tools

Personal (lit. unsupported) tools for exporting all your data from facebook.

## Warning

I'm uploading these and making them public because they might help someone get their data where they want it to be.

While I successfully extracted my photographic life from Facebook using these scripts, this is not a polished toolset or process.

Your milage will vary.

## Usage

This project assumes you're comfortable with node and its ecosystem:

 * clone the project
 * run `yarn` to install dependents
 * ensure you have `exiftool` installed
 * configure chrome remote devtools (if stated in the header of the script)
 * ensure you are logged in to facebook
 * download your personal facebook data dump into `./facebook`
 * `node ./_script_.js` (usage as below)

### history.js

Given a facebook personal data dump in `./facebook`, attempt to correctly set the EXIF data for all the albums in `photos_and_videos/album/**`.

### lasts.js

Given a facebook personal data dump in `./facebook`, attempt to visit, scrape, and correctly set the EXIF dates for all the files in `./facebook/photos_and_videos/your_posts`.

### photos.js

Given a list of facebook ids in `./tmp/fbid.json` as `["0000","1111","222"...]`, attempt to visit and scrape each photo and save the unix ms epoch date the photo was taken to `./tmp/state.json` as `{"000":123,"111":234,/*[facebook-id]: time*/}`.

`./tmp/state.json` is used as a recovery file as this process _will_ get you rate limited and temporarily blocked from the gallery pages. You'll have to keep stopping, letting the block cool-off, and restart.

This script is designed to be used to get the dates for the 'photos of me', which can then be used in tandem with `tags.js`.

See https://gnmerritt.net/deletefacebook/2018/04/03/fb-photos-of-me/ for a discussion of getting these `./tmp/fbid.json` and automating the downloading of the pictures.

### tag.js

Given a map of facebook ids and times in `./tmp/state.json` as `{"000":123,"111":234,/*[facebook-id]: time*/}`, correctly set the EXIF dates and attribute times for all the images in `./output` named as `_fbid_.jpg` (e.g. `./output/1234.jpg`).

To run this file as a script, the environment variable `FB_RUN` will need to be truthy, i.e. `FB_RUN=* ./tag.js`.