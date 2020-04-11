var express = require('express');
var router = express.Router();

const request = require('request');

const {metadataRuleSets} = require('page-metadata-parser');

const fetcher = require('../tools/fetcher');
const builder = require('../tools/builder');
const helper = require('../tools/helpers');

// presets for description
const presets = [
  { msg: 'Claim for free for a limited time.', free: true },
  { msg: 'Claim for free while supplies last.', free: true }
];

// platform specific stuff
const platforms = {
  "Steam": {
    color: 1514017,
    domains: [ "steampowered.com" ],
    generator: input => {
      if (input.Title.value.startsWith('Save ') && input.Title.value.includes('% on '))
        input.Title.value = helper.removeFromStart(input.Title.value, '% on ');
      input.Title.value = helper.removeFromEnd(input.Title.value, ' on Steam');

      return {
        "Client link": {
          type: 'hidden',
          display: builder.a,
          value: 'steam://openurl/' + input.URL.value,
          class: 'muted'
        }
      }
    }
  },
  "Battle.net": {
    color: 44799,
    domains: [ "battle.net" ]
  },
  "Origin": {
    color: 16084013,
    domains: [ "origin.com" ]
  },
  "Uplay": {
    color: 28927,
    domains: [ "ubisoft.com", "ubi.com" ]
  },
  "GOG": {
    color: 14584549,
    domains: [ "gog.com" ],
    generator: input => {
      input.Title.value = helper.removeFromEnd(input.Title.value, ' on GOG.com');

      return {
        'DRM-free': {
          type: 'hidden',
          display: builder.i,
          value: 'Yes',
          class: 'muted'
        }
      };
    }
  },
  "Epic": {
    color: 16777215,
    domains: [ "epicgames.com" ]
  },
  "Bethesda": {
    color: 16777215,
    domains: [ "bethesda.net" ]
  },
  "Humble Bundle": {
    color: 13248300,
    domains: [ "humblebundle.com" ],
    generator: input => {
      input.Title.value = helper.removeFromStart(input.Title.value, 'Buy ');
      input.Title.value = helper.removeFromEnd(input.Title.value, ' from the Humble Store');
    }
  }
};

router.get('/', function(req, res) {
  res.render('index', { presets: presets, url: req.query.url });
});

router.get('/announce', function(req, res) {
  let preset = req.query.preset !== undefined && req.query.preset !== 0 ? presets[req.query.preset-1] : undefined;

  let data = {
    URL: {
      type: 'hidden',
      display: req.query.url ? builder.a : builder.b,
      transformer: obj => { return obj.value ? obj.value : 'NOT PROVIDED' },
      value: req.query.url,
      disabled: !req.query.url
    },
    Title: {
      type: 'text',
      value: undefined
    },
    Description: {
      type: 'text',
      value: preset ? preset.msg : ""
    },
    Price: {
      type: 'text',
      value: undefined
    },
    Expires: {
      type: 'date',
      value: undefined
    },
    Image: undefined
  };

  // skip stuff based on url if not defined
  if (data.URL.value === undefined || data.URL.value === '')
  {
    res.render('announce', { data: data });
    return;
  }

  // detect platform, todo: this needs interruption
  // when platform is found
  Object.keys(platforms).forEach(platform => {
    platforms[platform].domains.forEach(domain => {
      if (data.URL.value.includes(domain))
      {
        data.Platform = {
          type: 'hidden',
          display: builder.i,
          value: platform,
          class: 'muted'
        };

        data.Color = {
          type: 'hidden',
          value: platforms[platform].color
        };
      }
    });
  });

  // todo: needs improvements
  Promise.all([
    fetcher.getMetadata(data.URL.value, metadataRuleSets.title, undefined),
    fetcher.getMetadata(data.URL.value, metadataRuleSets.image, undefined),
    fetcher.getMetadata(data.URL.value, metadataRuleSets.description, undefined),
    fetcher.getMetadata(data.URL.value, fetcher.rules.price, undefined),
    fetcher.getMetadata(data.URL.value, fetcher.rules.priceCurrency, undefined)
  ]).then(resolved => {
    data.Title.value = resolved[0];
    data.Image = resolved[1] ? {
      type: 'hidden',
      display: builder.image,
      value: resolved[1]
    } : undefined;
    data.Description.value = data.Description.value ? data.Description.value : resolved[2];

    if (resolved[3] && resolved[4]) {
      data.Price.value = resolved[3] + ' ' + resolved[4];

      if (preset && preset.free)
        data.Price.value = 'FREE ~~' + data.Price.value + '~~';
    }
      

    if ('Platform' in data && 'generator' in platforms[data.Platform.value])
      data = { ...data, ...platforms[data.Platform.value].generator(data) };

    res.render('announce', { data: data });
  }).catch(err => {
    res.render('announce', { data: data, msg: 'Metadata lookup failed.' });
  });
});

router.post('/announce', function(req, res) {
  let embed = {
    fields: []
  };

  const transformations = {
    Expires: helper.formatDate
  };

  let data = {};

  Object.keys(req.body).forEach(key => {
    let val = req.body[key];

    if (val !== undefined && val !== '')
    {
      data[key] = {
        type: 'hidden',
        display: builder.b,
        value: req.body[key]
      }
      
      switch (key) {
        case 'URL':
          embed.url = val;
          break;
        case 'Title':
          embed.title = val;
          break;
        case 'Description':
          embed.description = val;
          break;
        case 'Image':
          embed.image = { url: val };
          break;
        case 'Color':
          embed.color= val;
          break;
        default:
          embed.fields.push({
            name: key,
            value: key in transformations ? transformations[key](val) : val,
            inline: true
          });
        }
      }
  });

  if (!('title' in embed) || !('description' in embed)) {
    res.send('Title and Description are required.');
    return;
  }

  var hook = process.env.WEBHOOK;
  request.post(hook, { qs: { wait: true }, json: { embeds: [embed] } }, function(err, resp) {
    var success = resp.statusCode == 200;
    var msg = success ? "Successfully published!" : "The publishment failed!"
    // todo: the final page could be prettier
    res.render('announce', { data: data, title: msg, summary: true });
  });
});

module.exports = router;
