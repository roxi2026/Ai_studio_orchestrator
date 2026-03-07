// This script runs in the offscreen document and sends a message to the service worker every 20 seconds.
// This resets the service worker's 30-second idle timer, keeping it alive indefinitely.

setInterval(() => {
  chrome.runtime.sendMessage({ type: 'KEEPALIVE' });
}, 20000);
