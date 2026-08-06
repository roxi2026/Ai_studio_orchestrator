// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // Optimized URL-based network interception filtering
  // Safely normalizes URL objects, Request objects, and strings
  function getUrlString(urlInput) {
    if (!urlInput) return '';
    if (typeof urlInput === 'string') return urlInput;
    if (urlInput instanceof Request) return urlInput.url;
    if (urlInput instanceof URL) return urlInput.toString();
    if (typeof urlInput.toString === 'function') return urlInput.toString();
    return '';
  }

  // Filters out unnecessary interceptions to prevent massive overhead from static assets and telemetry
  function isTargetUrl(urlString) {
    const lowerUrl = urlString.toLowerCase();
    return lowerUrl.includes('generatecontent') ||
           lowerUrl.includes('v1beta') ||
           lowerUrl.includes('executor') ||
           lowerUrl.includes('reviewer');
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    const urlStr = getUrlString(url);
    
    if (isTargetUrl(urlStr)) {
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

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let isTarget = false;
    let requestUrl = '';

    const originalOpen = xhr.open;
    xhr.open = function(method, url, ...args) {
      requestUrl = getUrlString(url);
      isTarget = isTargetUrl(requestUrl);
      return originalOpen.call(this, method, url, ...args);
    };
    
    xhr.addEventListener('load', function() {
      if (!isTarget) return;

      // Determine which pane this XHR belongs to based on request URL or payload
      const pane = requestUrl.includes('executor') ? 'executor' : (requestUrl.includes('reviewer') ? 'reviewer' : 'unknown');
      
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
    const urlStr = getUrlString(args[0]);

    // Only clone and read the body for target URLs to optimize memory and CPU overhead
    if (isTargetUrl(urlStr)) {
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
