import { PDFParse } from 'pdf-parse';

const buffer = Buffer.from('Testing PDF parsing');
try {
  console.log('Testing PDFParse class...');
  const parser = new PDFParse({ data: buffer });
  parser.getText().then(result => {
    console.log('Parsed successfully! Text length:', result.text.length);
    console.log('Preview:', result.text.substring(0, 100));
  }).catch(err => {
    console.log('Expected parse error (binary data):', err.message);
  });
} catch (e) {
  console.error('Runtime Error:', e.message);
}
