const request = require('request');

module.exports = {
  getGameInfo(appid) {
    return new Promise(function(resolve, reject) {
      if (!Number.isInteger(appid))
        reject('AppID wasn\'t integer.');
      
      request.get('https://store.steampowered.com/api/appdetails?appids='+appid, { json: true }, function(err, resp, body) {
      if (resp.statusCode === 200 && body[appid].success)
        resolve(body[appid].data);
      reject('Invalid response from Steam. (HTTP ' + resp.statusCode + ')');
      });
    });
  },
};
