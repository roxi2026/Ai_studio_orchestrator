/**
 * verify_ui_logic.cjs - Verify the incremental UI rendering logic
 */

function mockUpdateUI(state, context) {
    const { logsDiv } = context;
    let currentLastRendered = context.lastRenderedTotalLogs;

    if (state.totalLogs < currentLastRendered) {
      logsDiv.children = []; // Clear mock children
      currentLastRendered = 0;
    }

    if (state.totalLogs > currentLastRendered) {
      const newLogsCount = Math.min(state.totalLogs - currentLastRendered, state.logs.length);
      const newLogs = state.logs.slice(-newLogsCount);

      newLogs.forEach(l => {
        const entry = { text: l };
        logsDiv.children.push(entry);
      });

      currentLastRendered = state.totalLogs;
    }

    context.lastRenderedTotalLogs = currentLastRendered;
}

const context = {
    logsDiv: { children: [], innerHTML: '' },
    lastRenderedTotalLogs: 0
};

console.log('Testing incremental rendering...');

// Initial state
const state1 = {
    logs: ['Log 1', 'Log 2'],
    totalLogs: 2
};
mockUpdateUI(state1, context);
console.log('State 1 (Initial):', context.logsDiv.children.length === 2 ? 'PASS' : 'FAIL');

// Incremental update
const state2 = {
    logs: ['Log 1', 'Log 2', 'Log 3'],
    totalLogs: 3
};
mockUpdateUI(state2, context);
console.log('State 2 (Incremental):', context.logsDiv.children.length === 3 ? 'PASS' : 'FAIL');

// Buffer cap reached
const state3 = {
    logs: ['Log 2', 'Log 3', 'Log 4'],
    totalLogs: 4
};
mockUpdateUI(state3, context);
console.log('State 3 (Buffer Cap):', context.logsDiv.children.length === 4 ? 'PASS' : 'FAIL');

// Reset
const state4 = {
    logs: ['New Log 1'],
    totalLogs: 1
};
mockUpdateUI(state4, context);
console.log('State 4 (Reset):', context.logsDiv.children.length === 1 ? 'PASS' : 'FAIL');

if (context.logsDiv.children.length === 1 && context.logsDiv.children[0].text === 'New Log 1') {
    console.log('All UI logic tests passed!');
} else {
    console.error('UI logic tests failed!');
    console.log('Final state:', JSON.stringify(context, null, 2));
    process.exit(1);
}
