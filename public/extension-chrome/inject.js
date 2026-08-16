// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Target URLs matching relevant AI Studio model generation endpoints
  function isTargetUrl(urlStr) {
    if (!urlStr) return false;
    const str = String(urlStr);
    return str.includes('generateContent') ||
           str.includes('v1beta') ||
           str.includes('executor') ||
           str.includes('reviewer') ||
           str.includes('prompts');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    const urlStr = String(url);
    if (!isTargetUrl(urlStr)) {
      return ws;
    }

    const pane = urlStr.includes('executor') ? 'executor' : (urlStr.includes('reviewer') ? 'reviewer' : 'unknown');
    
    ws.addEventListener('message', function(event) {
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'WS_MESSAGE',
        pane: pane,
        payload: event.data
      }, '*');
    });
    
    return ws;
  };
  
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    xhr.addEventListener('load', function() {
      if (!isTargetUrl(xhr.responseURL)) return;

      const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'XHR_RESPONSE',
        pane: pane,
        payload: xhr.responseText
      }, '*');
    });
    
    return xhr;
  };
  
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Safely extract URL string from Request, URL object, or string parameter
    let requestUrl = '';
    if (args[0]) {
      if (typeof args[0] === 'string') {
        requestUrl = args[0];
      } else if (args[0] instanceof Request) {
        requestUrl = args[0].url;
      } else if (args[0] instanceof URL) {
        requestUrl = args[0].href;
      } else {
        requestUrl = String(args[0]);
      }
    }

    // Optimization: Skip body clone & postMessage overhead for irrelevant fetch traffic (static assets, analytics, etc.)
    if (!isTargetUrl(requestUrl)) {
      return response;
    }

    // Clone the response only for relevant model generation calls
    const clonedResponse = response.clone();
    
    clonedResponse.text().then(text => {
      const pane = requestUrl.includes('executor') ? 'executor' : (requestUrl.includes('reviewer') ? 'reviewer' : 'unknown');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'FETCH_RESPONSE',
        pane: pane,
        payload: text
      }, '*');
    }).catch(err => {
      // Ignore reading error if response body is unreadable
    });
    
    return response;
  };

  // --- React Fiber Hook Simulation ---
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected:', renderer);
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {
    },
    onCommitFiberUnmount: function() {}
  };

})();
