// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- Optimization: Filter for relevant AI Studio patterns to reduce overhead ---
  const INTERESTING_PATTERNS = ['generateContent', 'v1beta/models', 'executor', 'reviewer'];

  function shouldIntercept(url) {
    if (!url) return false;
    const urlStr = url.toString();
    return INTERESTING_PATTERNS.some(p => urlStr.includes(p));
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    if (shouldIntercept(url)) {
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'WS_MESSAGE',
          pane: pane,
          payload: event.data
        }, window.location.origin); // Enhanced security: target current origin
      });
    }
    
    return ws;
  };
  
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    // Patch open to capture URL early
    const originalOpen = xhr.open;
    xhr.open = function(method, url) {
      this._url = url;
      return originalOpen.apply(this, arguments);
    };

    xhr.addEventListener('load', function() {
      if (shouldIntercept(this._url || xhr.responseURL)) {
        const url = (this._url || xhr.responseURL).toString();
        const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'XHR_RESPONSE',
          pane: pane,
          payload: xhr.responseText
        }, window.location.origin);
      }
    });
    
    return xhr;
  };
  
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  // --- Fetch Interception ---
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const requestUrl = args[0] instanceof Request ? args[0].url : args[0];
    
    if (!shouldIntercept(requestUrl)) {
      return originalFetch.apply(this, args);
    }

    const response = await originalFetch.apply(this, args);
    const clonedResponse = response.clone();
    
    clonedResponse.text().then(text => {
      const url = requestUrl.toString();
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'FETCH_RESPONSE',
        pane: pane,
        payload: text
      }, window.location.origin);
    }).catch(err => console.error('[CC] Fetch intercept error:', err));
    
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
