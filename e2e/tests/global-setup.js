// Prima dei test locali: il sito deve essere compilato per il server LOCALE.
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const dir = path.join(__dirname, '..', '..', 'frontend', 'build-e2e', 'static', 'js');
  if (!fs.existsSync(dir)) {
    throw new Error('Manca frontend/build-e2e: esegui prima "npm run build:sito" nella cartella e2e.');
  }
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    if (fs.readFileSync(path.join(dir, f), 'utf8').includes('api.scontiroma.it')) {
      throw new Error('frontend/build-e2e punta alla produzione (api.scontiroma.it): ricompila con "npm run build:sito".');
    }
  }
};
