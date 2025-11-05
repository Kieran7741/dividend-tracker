#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const { parseString } = require('xml2js');

const url = 'https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    parseString(data, { explicitArray: false }, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        process.exit(1);
      }

      try {
        const observations = result['message:GenericData']['message:DataSet']['generic:Series']['generic:Obs'];
        
        const exchangeRates = observations.reduce((acc, obs) => {
          const date = obs['generic:ObsDimension'].$.value;
          const rate = parseFloat(obs['generic:ObsValue'].$.value);
          acc[date] = rate;
          return acc;
        }, {});

        fs.writeFileSync('public/exchange-rates.json', JSON.stringify(exchangeRates, null, 2));
        console.log('Exchange rates saved to public/exchange-rates.json');
      } catch (error) {
        console.error('Error extracting data:', error);
        process.exit(1);
      }
    });
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err);
  process.exit(1);
});
