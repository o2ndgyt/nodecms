var fs = require('fs-extra'),
  uuidv4 = require('uuid/v4'),
  comfunc = require(`${__base}app/comfunc.js`),
  rssConverter = require('rss-converter'),
  _ = require('lodash'),
  moment = require('moment'),
  JsonDB = require('node-json-db'),
  dbrss = new JsonDB(`${__base}db/plugindb/cmsrss`, true, false);

try {
  dbrss.reload();
  var addata = dbrss.getData("/");
  addata.forEach(function (value) {
    if (moment(value.LastRefresh).add(value.Hour, 'h') < moment.utc()) {
      // refresh time
      try {
        // delete old post 
        dbrsspost = new JsonDB(`${__base}db/plugindb/cmsrss_${value.Id}`, true, false);
        var addata = dbrsspost.getData("/");
        var filtered = addata.filter(function (value) { return moment(value.LastRefresh).add(value.DelPost, 'd') <= moment.utc(); });
        dbrsspost.push("/", filtered);

        // load rssConverter

        (async () => {
          let feed = await rssConverter.toJson(value.RSSurl);
          console.log(feed);
          var rssdata=[];
          

        })();
      }
      catch (err) { console.log(err); }
    }

  });
}
catch (err) { console.log(err); }