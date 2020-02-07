var fs = require('fs-extra'),
  uuidv4 = require('uuid/v4'),
  comfunc = require(`${__base}app/comfunc.js`),
  _ = require('lodash'),
  moment = require('moment'),
  JsonDB = require('node-json-db'),
  dbrss = new JsonDB(`${__base}db/plugindb/cmsrss`, true, false);

  try {
    dbrss.reload();
    var addata = dbrss.getData("/");
    addata.forEach(function (value) {
        if ( moment(value.LastRefresh).add(value.Hour,'h') < moment.utc())
        {
            // refresh time

            // delete old post 
            dbrsspost = new JsonDB(`${__base}db/plugindb/cmsrss_${value.Id}`, true, false);
            var addata = dbrsspost.getData("/");
            var filtered = addataAds.filter(function (value) { return moment(value.LastRefresh).add(value.DelPost,'d') <= moment.utc(); });
            dbrsspost.push("/", filtered);

        }
        
    });
  }
  catch (err) { console.log(err); }