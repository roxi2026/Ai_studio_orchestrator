// verification/verify_performance.cjs
// Benchmark to measure and verify the performance difference between legacy O(N) log list rendering and Bolt's O(1) incremental rendering.

console.log("⚡ Bolt Performance Benchmarking Suite ⚡");
console.log("========================================");

// Simulated DOM elements for measurement
class MockElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.textContent = '';
  }

  appendChild(child) {
    this.children.push(child);
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
  }

  get firstChild() {
    return this.children[0] || null;
  }

  // Simulating innerHTML setter, which is O(N) and parses the entire HTML string
  set innerHTML(val) {
    this.children = [];
    if (val === '') {
      this._innerHTML = '';
      return;
    }
    this._innerHTML = val;
    // Simulate parsing overhead: time proportional to string length and complexity
    // We can simulate parsing by creating dummy elements
    const parts = val.split('</div>');
    for (const part of parts) {
      if (part.trim()) {
        const item = new MockElement('div');
        item.textContent = part.replace(/<[^>]*>/g, '');
        this.children.push(item);
      }
    }
  }

  get innerHTML() {
    return this._innerHTML || '';
  }
}

// Global document simulation
const mockDocument = {
  createElement(tag) {
    return new MockElement(tag);
  },
  createTextNode(text) {
    const el = new MockElement();
    el.textContent = text;
    return el;
  },
  createDocumentFragment() {
    return new MockElement('fragment');
  }
};

const NUM_LOGS = 50;
const UPDATES = 2000; // Simulating 2000 consecutive updates

// Let's pre-generate dummy logs
const logsDatabase = Array.from({ length: 5000 }, (_, i) => `[12:34:56] Simulated log message number ${i} which has some long-ish string format content`);

// Legacy O(N) Render Simulation
function runLegacyRender() {
  const container = new MockElement('div');
  const start = process.hrtime.bigint();

  let currentLogs = [];

  for (let step = 0; step < UPDATES; step++) {
    // Simulate background adding log and slicing to max 50
    currentLogs.push(logsDatabase[step]);
    if (currentLogs.length > NUM_LOGS) {
      currentLogs.shift();
    }

    // Legacy O(N) re-render
    container.innerHTML = currentLogs.map(l => `<div>> ${l}</div>`).join('');
  }

  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // millisecond duration
}

// Bolt O(1) Incremental Render Simulation
function runBoltIncrementalRender() {
  const container = new MockElement('div');
  const start = process.hrtime.bigint();

  let currentLogs = [];
  let totalLogs = 0;
  let lastRenderedTotalLogs = 0;

  for (let step = 0; step < UPDATES; step++) {
    // Simulate background adding log and slicing to max 50
    currentLogs.push(logsDatabase[step]);
    totalLogs++;
    if (currentLogs.length > NUM_LOGS) {
      currentLogs.shift();
    }

    // Bolt O(1) Incremental rendering
    if (totalLogs < lastRenderedTotalLogs || lastRenderedTotalLogs === 0) {
      container.innerHTML = '';
      lastRenderedTotalLogs = 0;
    }

    if (totalLogs > lastRenderedTotalLogs) {
      const newLogsCount = Math.min(totalLogs - lastRenderedTotalLogs, currentLogs.length);
      const startIndex = currentLogs.length - newLogsCount;
      const fragment = mockDocument.createDocumentFragment();

      for (let i = startIndex; i < currentLogs.length; i++) {
        const l = currentLogs[i];
        const entryDiv = mockDocument.createElement('div');
        entryDiv.appendChild(mockDocument.createTextNode('> ' + l));
        fragment.appendChild(entryDiv);
      }

      // Append the whole fragment at once
      for (const child of fragment.children) {
        container.appendChild(child);
      }

      lastRenderedTotalLogs = totalLogs;

      while (container.children.length > NUM_LOGS) {
        container.removeChild(container.firstChild);
      }
    }
  }

  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // millisecond duration
}

console.log(`Running benchmark with ${UPDATES} log updates (sliding window cap = ${NUM_LOGS})...`);

const legacyTime = runLegacyRender();
const boltTime = runBoltIncrementalRender();

console.log(`\nResults:`);
console.log(`- Legacy O(N) InnerHTML re-render time: ${legacyTime.toFixed(2)} ms`);
console.log(`- Bolt O(1) Incremental append time:     ${boltTime.toFixed(2)} ms`);

const speedup = legacyTime / boltTime;
console.log(`\n🚀 Bolt is ${speedup.toFixed(2)}x FASTER!`);
console.log("========================================");
