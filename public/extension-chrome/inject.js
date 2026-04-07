// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected. Intercepting network requests...');

  // --- Filtering Logic ---
  const isAIStudioRelated = (url) => {
    const urlStr = url.toString();
    return urlStr.includes('generateContent') ||
           urlStr.includes('v1beta/models') ||
           urlStr.includes('executor') ||
           urlStr.includes('reviewer');
  };

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    
    if (isAIStudioRelated(url)) {
      const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');

      ws.addEventListener('message', function(event) {
        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'WS_MESSAGE',
          pane: pane,
          payload: event.data
        }, window.location.origin);
      });
    }
    
    return ws;
  };
  
  window.WebSocket.prototype = OriginalWebSocket.prototype;

  // --- XMLHttpRequest Interception ---
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    
    xhr.addEventListener('load', function() {
      if (isAIStudioRelated(xhr.responseURL)) {
        const pane = xhr.responseURL.includes('executor') ? 'executor' : (xhr.responseURL.includes('reviewer') ? 'reviewer' : 'unknown');

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
    const response = await originalFetch.apply(this, args);
    const url = args[0] instanceof Request ? args[0].url : args[0];

    if (isAIStudioRelated(url)) {
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        const pane = url.toString().includes('executor') ? 'executor' : (url.toString().includes('reviewer') ? 'reviewer' : 'unknown');

        window.postMessage({
          source: 'ORCHESTRATOR_INJECT',
          type: 'FETCH_RESPONSE',
          pane: pane,
          payload: text
        }, window.location.origin);
      });
    }
    
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
