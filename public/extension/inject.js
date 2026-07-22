// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[Orchestrator] Main world script injected. Intercepting network requests...');

  // --- URL Relevance Check & Normalization ---
  function isRelevantUrl(urlInput) {
    if (!urlInput) return false;
    let urlStr = '';
    if (typeof urlInput === 'string') {
      urlStr = urlInput;
    } else if (urlInput instanceof URL) {
      urlStr = urlInput.href;
    } else if (typeof Request !== 'undefined' && urlInput instanceof Request) {
      urlStr = urlInput.url;
    } else {
      urlStr = String(urlInput);
    }
    return urlStr.includes('generateContent') ||
           urlStr.includes('v1beta') ||
           urlStr.includes('executor') ||
           urlStr.includes('reviewer');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    const urlStr = String(url);
    const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');
    
    // Only register listener and forward messages for relevant/known targets
    if (pane !== 'unknown') {
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
      const url = xhr.responseURL;
      // Filter URL to only forward messages for relevant targets
      if (isRelevantUrl(url)) {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
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

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    let url = '';
    if (args[0]) {
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].href;
      } else if (typeof Request !== 'undefined' && args[0] instanceof Request) {
        url = args[0].url;
      } else {
        url = String(args[0]);
      }
    }

    // Only clone and read body for relevant AI Studio API traffic
    if (isRelevantUrl(url)) {
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, '*');
      }).catch(() => {
        // Ignore read errors gracefully
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
      console.log('[Orchestrator] React Fiber renderer injected:', renderer);
      // Hook into renderer commit events to read state object selectors
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
      // Read current conversational context directly from application's memory pool
      // Map state object selectors to identify variables controlling temperature limits, active model selection, etc.
    },
    onCommitFiberUnmount: function() {}
  };

})();
