const fetch = require('node-fetch');
const domino = require('domino');
const {getMetadata, metadataRuleSets} = require('page-metadata-parser');

const rules = {
  price: {
    rules: [
      ['meta[itemprop="price"]', element => element.getAttribute('content')]
    ]
  },

  priceCurrency: {
    rules: [
      ['meta[itemprop="priceCurrency"]', element => element.getAttribute('content')]
    ]
  }
};

module.exports = {
  getMetadata: async function(url, key, abort) {
    const response = await fetch(url, { signal: abort });
    const html = await response.text();
    const doc = domino.createWindow(html).document;
    return getMetadata(doc, url, {key}).key;
  },

  rules
};
