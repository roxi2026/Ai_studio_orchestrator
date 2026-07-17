// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- WebSocket Interception with URL Filtering ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Safely convert URL to string
    let urlStr = '';
    if (url) {
      urlStr = url instanceof URL ? url.toString() : String(url);
    }
    
    // Check if the URL is relevant for AI Studio APIs
    const isTarget = urlStr.includes('generateContent') ||
                     urlStr.includes('v1beta') ||
                     urlStr.includes('executor') ||
                     urlStr.includes('reviewer');

    if (isTarget) {
      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
        // Forward the intercepted message to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'WS_MESSAGE',
          pane: pane,
          payload: event.data
        }, '*');
      });
    }
    
    return ws;
  };
  
  // Copy prototype to ensure compatibility
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception with URL Filtering ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let requestUrl = '';

    const originalOpen = xhr.open;
    xhr.open = function(method, url, ...args) {
      if (url) {
        requestUrl = url instanceof URL ? url.toString() : String(url);
      }
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.addEventListener('load', function() {
      // Check if the URL is relevant for AI Studio APIs
      const isTarget = requestUrl.includes('generateContent') ||
                       requestUrl.includes('v1beta') ||
                       requestUrl.includes('executor') ||
                       requestUrl.includes('reviewer');

      if (isTarget) {
        const pane = requestUrl.includes('executor') ? 'executor' : (requestUrl.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'XHR_RESPONSE',
          pane: pane,
          payload: xhr.responseText
        }, '*');
      }
    });
    
    return xhr;
  };
  
  // Copy prototype to ensure compatibility
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception with URL Filtering ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Normalize and safely convert URL input to a string
    let urlStr = '';
    if (args[0]) {
      if (typeof args[0] === 'string') {
        urlStr = args[0];
      } else if (args[0] instanceof URL) {
        urlStr = args[0].toString();
      } else if (args[0] instanceof Request) {
        urlStr = args[0].url;
      } else {
        try {
          urlStr = String(args[0]);
        } catch (e) {
          urlStr = '';
        }
      }
    }
    
    // Check if the URL is relevant for AI Studio APIs
    const isTarget = urlStr.includes('generateContent') ||
                     urlStr.includes('v1beta') ||
                     urlStr.includes('executor') ||
                     urlStr.includes('reviewer');

    if (isTarget) {
      // Clone the response so we can read the body without consuming it for the original caller
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

        // Forward the intercepted response to the content script
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(err => {
        console.warn('[CC] Failed to read fetch response body:', err);
      });
    }
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  // Inject initialization script before main application bundle executes to capture commit events
  // This allows reading conversational context directly from memory pool
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected:', renderer);
      // Hook into renderer commit events to read state object selectors
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
      // Read current conversational context directly from application's memory pool
      // Map state object selectors to identify variables controlling temperature limits, active model selection, etc.
    },
    onCommitFiberUnmount: function() {}
  };

})();
