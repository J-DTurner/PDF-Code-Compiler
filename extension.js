const vscode = require('vscode');
const PdfGenerator = require('./functions/pdfGenerator');
const path = require('path');

function activate(context) {
    console.log('Activating LLMHelper extension...');

    const provider = new PdfCodeViewProvider(context.extensionUri);
    const treeDataProvider = new MyDataProvider();

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(PdfCodeViewProvider.viewType, provider),
        vscode.window.registerTreeDataProvider('llmhelper.pdfCodeView', treeDataProvider),
        vscode.commands.registerCommand('llmhelper.generatePdf', () => {
            provider.generatePdf();
        })
    );

    console.log('LLMHelper extension activated');
}

class PdfCodeViewProvider {
    static viewType = 'llmhelper.pdfCodeView';

    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
      
        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [this._extensionUri]
        };
      
        this._update();
      
        webviewView.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case 'generatePdf':
                this.generatePdf();
                break;
            }
          }
        );
      }

    generatePdf() {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating PDF...',
                cancellable: false
            },
            async (progress, token) => {
                const currentDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
                const outputFile = path.join(currentDirectory, 'output.pdf');
    
                await PdfGenerator.generatePdf(currentDirectory, outputFile);
    
                vscode.window.showInformationMessage('PDF generated successfully!');
            }
        );
    }

    _update() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        
        const nonce = getNonce();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PDF Code Generator</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                h1 {
                    color: #0066cc;
                }
                p {
                    margin-bottom: 20px;
                }
                .button-container {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                }
                .button-wrapper {
                    text-align: center;
                }
                .button-wrapper p {
                    margin-bottom: 10px;
                }
                button {
                    border: none;
                    border-radius: 5px;
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    width: 200px;
                    height: 50px;
                }
                #generateBtn {
                    background-color: #0066cc;
                    color: white;
                }
                #generateBtn:hover {
                    background-color: #004c99;
                }
                #coffeeBtn {
                    background-color: #FFDD00;
                    color: #000000;
                }
                #coffeeBtn:hover {
                    background-color: #FFD700;
                }
                .social-links {
                    margin-top: 20px;
                    text-align: center;
                }
                .social-links p {
                    display: inline;
                    margin-right: 10px;
                }
                .social-links a {
                    color: #0066cc;
                    text-decoration: none;
                    margin-right: 10px;
                }
                .social-links a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h1>PDF Code Generator</h1>
            <p>This extension allows you to generate a PDF document containing the source code files from your project. The generated PDF will include a table of contents and the contents of various code files such as JavaScript, HTML, CSS, JSON, and Python files.</p>
        
            <div class="button-container">
                <div class="button-wrapper">
                    <p>Click here to generate:</p>
                    <button id="generateBtn">Generate PDF</button>
                </div>
                <div class="button-wrapper">
                    <p>Support My Work:</p>
                    <a href="https://www.patreon.com/JDTurner" target="_blank">
                        <button id="coffeeBtn">☕ Buy Me A Coffee</button>
                    </a>
                </div>
            </div>
        
            <div class="social-links">
                <p>Connect with me:</p>
                <a href="https://www.linkedin.com/in/jamesturnercm/" target="_blank">LinkedIn</a>
                <a href="https://twitter.com/James_Gets_It" target="_blank">Twitter</a>
                <a href="https://github.com/JamesSKR" target="_blank">GitHub</a>
            </div>
        
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}

class MyDataProvider {
    getChildren(element) {
        if (!element) {
            return Promise.resolve([{ label: 'Generate PDF' }]);
        }
        return Promise.resolve([]);
    }

    getTreeItem(element) {
        return {
            label: element.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
                command: 'llmhelper.generatePdf',
                title: 'Generate PDF',
                arguments: []
            }
        };
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function deactivate() {
    console.log('Deactivating LLMHelper extension');
}

module.exports = {
    activate,
    deactivate,
    PdfCodeViewProvider,
    MyDataProvider
};