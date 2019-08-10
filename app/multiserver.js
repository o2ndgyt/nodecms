var proxy = require('redbird')({port:80}),
    JsonDB = require('node-json-db'),
    spdy = require('spdy'),
    http = require('http'),
    _ = require('lodash'),
    fs = require('fs-extra'),
    app = require(`${__base}app/app.js`),
    proxyWrap = require('findhit-proxywrap'),
    dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false);

var Servers=[];
var proxy_opts = {strict: false}; 

var multiserver = {
  Init: function ()
  {  
    var data = dbwebsites.getData("/");
    _.forEach(data, function (element) {

        var options = { key: element.RSA, cert: element.CER };
    
        Servers.push(
            {
            Server: http.createServer(app).listen(element.Port),
            // spdy.createServer(options, app).listen(element.Port),
            hostname: element.Website, Port:element.Port}
        )

        fs.writeFile(`${__base}cert/${element.Website}.rsa`, element.RSA);
        fs.writeFile(`${__base}cert/${element.Website}.cer`, element.CER);

        console.log(`https://${element.Website}:${element.Port}`);
        proxy.register(element.Website, `http://${element.Website}:${element.Port}`);

        // _.foreach
      });
      
    
  },
  Restart: function () {
 
  }
};

module.exports = multiserver;