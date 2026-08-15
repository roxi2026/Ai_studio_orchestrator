// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Helper to determine if a request URL targets AI Studio model generation or API endpoints
  function isRelevantUrl(input) {
    if (!input) return false;
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (typeof URL !== 'undefined' && input instanceof URL) {
      urlStr = input.href;
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      urlStr = input.url;
    } else if (typeof input === 'object' && input.url) {
      urlStr = String(input.url);
    } else {
      urlStr = String(input);
    }

    return urlStr.includes('generateContent') ||
           urlStr.includes('v1beta') ||
           urlStr.includes('executor') ||
           urlStr.includes('reviewer') ||
           urlStr.includes('prompts');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Check if WS URL is relevant before listening to minimize overhead
    if (isRelevantUrl(url)) {
      const urlStr = typeof url === 'string' ? url : (url && url.href ? url.href : String(url));
      const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
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

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    xhr.addEventListener('load', function() {
      // Early exit if the XHR URL is not relevant to AI Studio model orchestration
      if (!isRelevantUrl(xhr.responseURL)) return;

      const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
      
      // Forward the intercepted response to the content script
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'XHR_RESPONSE',
        pane: pane,
        payload: xhr.responseText
      }, '*');
    });
    
    return xhr;
  };
  
  // Copy prototype to ensure compatibility
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Fast path: skip response cloning, text conversion, and postMessage for non-relevant requests
    if (args[0] && isRelevantUrl(args[0])) {
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        const url = args[0] instanceof Request ? args[0].url : (args[0] instanceof URL ? args[0].href : String(args[0]));
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(() => {});
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
