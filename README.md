# Syncronized Youtube video playback

This is a React+Express SPA that lets you watch Youtube videos in sync with friends over the internet. Currently it is functional, but mostly just a proof of concept.

## Setup

`git clone https://github.com/justinrubek/youtube-sync.git`

`cd synctube-neo`

Navigate into the `static` directory, and install dependencies and build using `npm` or `yarn`

`cd static`

`npm i`

`npm run build`

Do the same for the `server` directory

`cd ../server`

`npm i`

`npm run build`

Start the server from within the `server` directory. The port can be set in `server/config.js` or with the PORT environmental variable. It defaults to 3000

`npm run start`

