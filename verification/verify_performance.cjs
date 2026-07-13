/**
 * verify_performance.cjs - Benchmark incremental vs full re-render
 * Revised to better simulate DOM costs (though still in Node)
 */

const ITERATIONS = 1000;
const LOG_HISTORY_CAP = 50;

function runBenchmark() {
    console.log(`Running benchmark with ${ITERATIONS} consecutive updates...`);

    // Legacy O(N) Re-render Simulation
    const startLegacy = process.hrtime.bigint();
    let legacyOutput = "";
    for (let i = 0; i < ITERATIONS; i++) {
        // Build 50 entries
        const logs = [];
        for (let j = 0; j < LOG_HISTORY_CAP; j++) {
            logs.push(`[12:00:00] Log entry ${i}-${j}`);
        }
        // Simulate innerHTML = logs.map(...).join('')
        legacyOutput = logs.map(l => `<div class="oo-log-entry"><span class="oo-log-time">12:00:00</span> ${l}</div>`).join('');
    }
    const endLegacy = process.hrtime.bigint();
    const legacyTime = Number(endLegacy - startLegacy) / 1e6;

    // Bolt O(1) Incremental Render Simulation
    const startBolt = process.hrtime.bigint();
    let lastTotal = 0;
    let boltOutput = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const totalLogs = i + 1;
        const currentLogs = [`[12:00:00] Log entry ${i}`];

        if (totalLogs > lastTotal) {
            const newCount = Math.min(totalLogs - lastTotal, 1);
            const toAppend = currentLogs.slice(-newCount);
            toAppend.forEach(l => {
                // Simulate document.createElement + textContent + appendChild
                const entry = { className: 'oo-log-entry', text: l };
                boltOutput.push(entry);
                if (boltOutput.length > LOG_HISTORY_CAP) boltOutput.shift();
            });
            lastTotal = totalLogs;
        }
    }
    const endBolt = process.hrtime.bigint();
    const boltTime = Number(endBolt - startBolt) / 1e6;

    console.log(`Legacy O(N) re-render: ${legacyTime.toFixed(4)}ms`);
    console.log(`Bolt O(1) incremental: ${boltTime.toFixed(4)}ms`);
    console.log(`Estimated Speedup: ${(legacyTime / boltTime).toFixed(2)}x`);
}

runBenchmark();
