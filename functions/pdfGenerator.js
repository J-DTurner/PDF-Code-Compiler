const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const hljs = require('highlight.js');

class PdfGenerator {
  static generatePdf(currentDirectory, outputFile) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputFile));

    this.defineStyles(doc);
    const toc = this.createTableOfContents();

    const fileExtensions = ['*.js', '*.html', '*.css', '*.json', '*.py'];
    const excludeDirectories = ['docs', 'obj', 'bin', 'lib', 'node_modules', 'Migrations', '.vs', 'Properties', '__pycache__', 'venv'];

    for (const ext of fileExtensions) {
      const files = this.getFiles(currentDirectory, ext, excludeDirectories);
      for (const file of files) {
        const relativeFilePath = path.relative(currentDirectory, file);
        console.log('Processing ' + relativeFilePath);

        try {
          const fileContent = fs.readFileSync(file, 'utf-8');
          if (!fileContent.trim()) {
            console.log(`Warning: The file '${relativeFilePath}' is empty or whitespace.`);
            continue;
          }

          doc.addPage();
          toc.addPage(relativeFilePath, doc.page);

          doc.font('Helvetica-Bold').fontSize(14).text(relativeFilePath);
          console.log(`Added heading for ${relativeFilePath}`);

          const highlightedCode = hljs.default.highlightAuto(fileContent).value;
          doc.font('Courier').fontSize(10).fillColor('black');

          const lines = highlightedCode.split('\n');
          for (const line of lines) {
            doc.text(line, { continued: true });
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }
          }
          doc.text('', { continued: false });

          console.log(`Added content for ${relativeFilePath}`);

          doc.moveDown(2);
          console.log(`Added spacing after ${relativeFilePath}`);
        } catch (ex) {
          console.log(`Error processing file '${relativeFilePath}': ${ex.message}`);
        }
      }
    }

    doc.addPage();
    this.renderTableOfContents(doc, toc.data);

    doc.end();
    console.log(`PDF saved to ${outputFile}`);
  }

  static defineStyles(doc) {
    doc.registerFont('Helvetica', 'Helvetica');
    doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
    doc.registerFont('Courier', 'Courier');
  }

  static createTableOfContents() {
    const toc = {
      data: [],
      addPage: function(title, pageNumber) {
        this.data.push({ title, pageNumber });
      }
    };
    return toc;
  }

  static renderTableOfContents(doc, tocData) {
    doc.font('Helvetica-Bold').fontSize(18).text('Table of Contents');
    doc.moveDown();

    tocData.forEach(item => {
      doc.fontSize(12);
      doc.fillColor('blue');
      doc.text(item.title, { link: item.pageNumber, underline: true });
      doc.fillColor('black');
      doc.font('Helvetica').fontSize(10).text(` ..... ${item.pageNumber}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
  }

  static getFiles(directory, extension, excludeDirectories) {
    const files = [];
    const getFilesRecursively = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!excludeDirectories.includes(entry.name)) {
            getFilesRecursively(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith(extension.slice(1))) {
          if (this.isFileContentSuitableForPdf(fullPath)) {
            files.push(fullPath);
          } else {
            console.log(`Skipping file due to unsuitable content: ${fullPath}`);
          }
        }
      }
    };
    getFilesRecursively(directory);
    return files;
  }

  static isFileContentSuitableForPdf(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.length > 1000) {
        console.log(`Warning: Long line detected in ${filePath}`);
        return false;
      }
    }
    return true;
  }
}

module.exports = PdfGenerator;