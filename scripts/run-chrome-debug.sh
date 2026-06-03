#!/bin/bash
# Script to launch Google Chrome with remote debugging enabled on macOS.
# Using a separate profile directory so you don't have to close your main Chrome browser.

echo "================================================================"
echo "🚀 Starting Chrome with Remote Debugging (Port 9222)"
echo "================================================================"
echo "Opening Chrome with profile at: ~/tmp/chrome-debug"
echo "Log into Facebook in the browser window that opens."
echo "Keep that browser window open while you run the scraper!"
echo "================================================================"

mkdir -p "$HOME/tmp/chrome-debug"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/tmp/chrome-debug"
