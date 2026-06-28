// inject.js - Injected into the main world of AI Studio to intercept network requests

(function() {
  console.log('[CC] Main world script injected.');

  // Optimization: Only intercept relevant AI Studio APIs
  const RELEVANT_PATHS = ['executor', 'reviewer', 'v1beta', 'generateContent'];

  function isRelevant(url) {
    const urlStr = String(url);
    return RELEVANT_PATHS.some(path => urlStr.includes(path));
  }

  // --- WebSocket Interception ---
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const ws = new OriginalWebSocket(url, protocols);
    const pane = url.includes('executor') ? 'executor' : (url.includes('reviewer') ? 'reviewer' : 'unknown');
    
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
      if (!isRelevant(xhr.responseURL)) return;
      
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
    const url = args[0] instanceof Request ? args[0].url : args[0];

    if (isRelevant(url)) {
      // Optimization: Only clone and read body if relevant
      const clonedResponse = response.clone();
      clonedResponse.text().then(text => {
        const pane = String(url).includes('executor') ? 'executor' : (String(url).includes('reviewer') ? 'reviewer' : 'unknown');
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

  // React Fiber Hook Simulation
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function(renderer) {
      console.log('[CC] React Fiber renderer injected.');
    },
    onCommitFiberRoot: function(rendererID, root, priorityLevel) {},
    onCommitFiberUnmount: function() {}
  };

})();
