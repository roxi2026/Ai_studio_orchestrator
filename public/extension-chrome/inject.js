// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  // Optimization: Pre-define filters to reduce CPU overhead during interception
  const AI_STUDIO_PATTERNS = ['executor', 'reviewer', 'v1beta/models', 'generateContent'];
  const shouldIntercept = (url) => {
    if (!url) return false;
    const urlStr = url.toString();
    return AI_STUDIO_PATTERNS.some(pattern => urlStr.includes(pattern));
  };

  console.log('[CC] Main world script injected. Intercepting filtered AI Studio requests...');

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    // Optimization: Only hook into messages if the URL matches AI Studio patterns
    if (shouldIntercept(url)) {
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'ai-studio');

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
      // Optimization: Only process if the response URL matches patterns
      if (shouldIntercept(xhr.responseURL)) {
        const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'ai-studio');

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
    const url = args[0] instanceof Request ? args[0].url : args[0];
    
    // Optimization: Early exit for non-relevant requests to avoid unnecessary cloning/awaiting
    if (!shouldIntercept(url)) {
      return originalFetch.apply(this, args);
    }

    const response = await originalFetch.apply(this, args);
    const clonedResponse = response.clone();
    
    clonedResponse.text().then(text => {
      const pane = url.toString().includes('executor') ? 'executor' : (url.toString().includes('reviewer') ? 'reviewer' : 'ai-studio');
      
      window.postMessage({
        source: 'ORCHESTRATOR_INJECT',
        type: 'FETCH_RESPONSE',
        pane: pane,
        payload: text
      }, '*');
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
      // Read current conversational context directly from application's memory pool
    },
    onCommitFiberUnmount: function() {}
  };

})();
