var proxy_opts = {strict: false}; 
var proxyWrap = require('findhit-proxywrap');
var opts = {
    port: 80,
    secure: false,
    serverModule: proxyWrap.proxy( require('http'), proxy_opts),
    ssl: {
        //Do this if you want http2:
       http2: true,        
       serverModule: proxyWrap.proxy(require('spdy').server, proxy_opts),
        //Do this if you only want regular https
        // serverModule: proxyWrap.proxy( require('http'), proxy_opts), 
        port: 443,
        key: `${__base}cert/default.rsa`,
        cert: `${__base}cert/default.cer`,
    }
}

var proxy = require('redbird')(opts),
    JsonDB = require('node-json-db'),
    spdy = require('spdy'),
    http = require('http'),
    _ = require('lodash'),
    fs = require('fs-extra'),
    app = require(`${__base}app/app.js`)
    dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false);

var Servers=[];

var multiserver = {
  Init: function ()
  {  
    var data = dbwebsites.getData("/");
    _.forEach(data, function (element) {

        var options = { key: element.RSA, cert: element.CER };
    
        Servers.push(
            {
            Server: spdy.createServer(options, app).listen(element.Port),
            // http.createServer(app).listen(element.Port),
            hostname: element.Website, Port:element.Port}
        )

        fs.writeFile(`${__base}cert/${element.Website}.rsa`, element.RSA);
        fs.writeFile(`${__base}cert/${element.Website}.cer`, element.CER);

        console.log(`https://${element.Website}:${element.Port}`);
        if (element.Website=="sportonline.dev")
        {
        proxy.register(element.Website, `https://${element.Website}:${element.Port}`,
        {
          ssl: {
            redirect: true,
            key: `${__base}cert/${element.Website}.rsa`,
            cert: `${__base}cert/${element.Website}.cer`,
          }

        });
      }
        // _.foreach
      });
      
    
  },
  Restart: function () {
 
  }
};

module.exports = multiserver;