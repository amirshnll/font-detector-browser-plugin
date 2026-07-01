# Font Detector

A minimal Chrome + Firefox extension that detects the fonts used on the current
website and lets you download the font files (woff/woff2/ttf/otf/eot) in one click.

## Download

- **Chrome / Edge / Brave:** [https://chromewebstore.google.com/detail/mkpoaoahfjiichkbfgnpfljcopjglkfn?utm_source=item-share-cb]
- **Firefox:** []

## Features

- **Used fonts** — lists the font families actually rendered on the page (click *Copy* to grab the name).
- **Downloadable files** — finds `@font-face` and network-loaded font files and downloads them with one click.
- **Minimal UI** — a single small popup, one icon, no setup.
- **10 languages** via the WebExtension i18n system: English, Español, Français, Deutsch,
  Português, Русский, 中文 (简体), 日本語, العربية, فارسی. RTL layout is applied automatically.
  The language follows the browser's UI language.

## Usage

1. Open any website.
2. Click the **A** icon in the toolbar.
3. See the fonts in use and download any available font file. Use the ⟳ button to rescan.

## Install (Chrome / Edge / Brave)

1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this `font-detector` folder.

## Install (Firefox)

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select the `manifest.json` file inside this folder.

> For a permanent install, package and sign the extension via
> [addons.mozilla.org](https://addons.mozilla.org/developers/) (Firefox) or the
> Chrome Web Store.

## How it works

The popup injects a small scanner (`scanPage` in `popup.js`) into the active tab using
the `scripting` API. It collects:

1. Font families from the computed styles of page elements.
2. Font file URLs from same-origin `@font-face` rules.
3. Font file URLs from the Resource Timing API (catches cross-origin fonts).

Downloads use the `downloads` API, so cross-origin font files download correctly.

## Files

```
manifest.json        MV3 manifest (Chrome + Firefox)
popup.html/css/js    The popup UI, i18n, scanner and rendering
icons/               16/32/48/128 px PNG icons
_locales/<lang>/     i18n strings for 10 languages
```
