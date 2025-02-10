# ![logo](src/assets/logo-24x24.png) Visual Snippets: Screenshot, Annotate & Share

[![Xtension](https://circleci.com/gh/justiceo/visual-snippets-extension/tree/main.svg?style=svg)](https://circleci.com/gh/justiceo/visual-snippets-extension/?branch=main)

## Project setup

```bash
# Install dependencies
npm install

# Build extension for development, watch for file changes and rebuild.
npm run build
npm run watch

# Generate compliant images assets for logo (default logo location src/assets/logo.png)
npm run generateIcons

# Translate app strings to all supported chrome locales
npm run translate

# Start an instance of Chromium with extension installed (using puppeteer)
# For Firefox, pass --browser=firefox as argument.
npm run start

# Build and package extension into a store-ready upload
node tools/esbuild.js build --prod

# Create extension package for Firefox/Opera/Edge by specifying --browser argument
node tools/esbuild.js build --prod  --browser=firefox

# Run tests
npm run test
```

<details><summary>E2E testing with Firefox.</summary>

By default, puppeteer only downloads Chromium, run the command below to install Firefox's equivalent of chromium:

```
PUPPETEER_PRODUCT=firefox npm i -D puppeteer --prefix ./node_modules/firefox-puppeteer
```

`PUPPETEER_PRODUCT=firefox` tells puppeteer to download firefox.

`--prefix ./node_modules/firefox-puppeteer` forces a new fetch of puppeteer. This is necessary since `node_modules/puppeteer` already exists (for chromium). The actual value of the prefix doesn't matter, just don't overwrite an actual package.

_NB:_ After running the above command, they will no be update to package.json or package-lock.json... since package "puppeteer" already exists.

</details>

## Install extension locally

#### Chrome

1. Open chrome and navigate to extensions page using this URL: chrome://extensions.
2. Enable the "Developer mode".
3. Click "Load unpacked extension" button, browse to `build/chrome-prod` or the `build/chrome-dev` directory and select it.

#### Firefox

1. Open firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click the "Load Temporary Add-on" button.
3. Browse to the `build/firefox-prod` or the `build/firefox-dev` directory and select the `manifest.json` file.
