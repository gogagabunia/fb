# GroupMarket Connector — browser extension

One-click Facebook connection for GroupMarket admins. No cookie copy-paste.

## What it does
Reads the Facebook session you're already logged into (in this browser) and
sends it to your GroupMarket account. It never asks for your Facebook password
and it authenticates using your logged-in GroupMarket session.

## Install (Chrome / Edge / Brave)
1. Go to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this `browser-extension` folder.
4. The **GroupMarket Connector** icon appears in your toolbar.

## Use
1. In the same browser, log into **facebook.com** and into **GroupMarket**.
2. Click the extension icon → **Connect this Facebook account**.
3. Done — go to GroupMarket and sync your groups.

## Custom domain
If your GroupMarket runs on a domain other than `fb-two-rho.vercel.app`:
- Change the URL in the extension popup, **and**
- Add that domain to `host_permissions` in `manifest.json`, then reload the extension.

## Publishing (optional)
For real users, zip this folder and publish it to the Chrome Web Store so they
can install with one click instead of "Load unpacked".
