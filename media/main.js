/* global acquireVsCodeApi */

/**
 * @typedef {Object} VSCodeAPI
 * @property {(message: any) => void} postMessage
 */

/**
 * This function wraps the acquireVsCodeApi to provide type information.
 * @returns {VSCodeAPI}
 */
function getVsCodeApi() {
    // @ts-ignore
    return acquireVsCodeApi();
}

const vscode = getVsCodeApi();

document.getElementById('generateBtn').addEventListener('click', () => {
    vscode.postMessage({
        command: 'generatePdf'
    });
});
