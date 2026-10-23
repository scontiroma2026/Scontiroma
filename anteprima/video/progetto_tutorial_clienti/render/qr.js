// QR del finale (SVG) con la stessa libreria del sito (qrcode.react), nessun servizio esterno.
// Uso: NODE_PATH=<frontend/node_modules> node qr.js <uscita.svg>
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');
const URL = 'https://scontiroma.it/?fonte=video-tutorial';
const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { value: URL, size: 600, level: 'M', marginSize: 0, fgColor: '#14102A', bgColor: '#FFFFFF' }));
require('fs').writeFileSync(process.argv[2], svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
console.log('QR per', URL);
