// Utility to extract text from a PDF file in the browser
// Place in src/utils/pdfExtract.js

export async function extractTextFromPDF(file) {
  // Validate file type
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Please upload a valid PDF file.');
  }
  // Dynamically import pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  } catch (err) {
    throw new Error('Failed to extract text from PDF. The file may be corrupted or not a valid PDF.');
  }
}
