var JsonDB = require('node-json-db'),
  spdy = require('spdy'),
  http = require('http'),
  https = require('https'),
  _ = require('lodash'),
  fs = require('fs-extra'),
  app = require(`${__base}app/app.js`),
  db = new JsonDB(`${__base}db/config`, true, false),
  DbFunc = require(`${__base}app/routers/dbfunc.js`);

require('http-shutdown').extend();

var Servers = [];
var configdata = db.getData("/");
var data = DbFunc[configdata.DB + "_ListWebsites"](2);

var defnginx = `${__base}private/nginx/default.nginx.conf`;
var defapache = `${__base}private/apache/default.apache.conf`;

/*
_.forEach(data, function (element) {

  var options = { key: element.RSA, cert: element.CER };

  Servers.push(
      {
      Server: http.createServer(app).listen(element.Port),
      //spdy.createServer(options, app).listen(element.Port),
      // 
      hostname: element.Website, Port:element.Port, IsRunning:true}
  )

  fs.writeFile(`${__base}cert/${element.Website}.rsa`, element.RSA);
  fs.writeFile(`${__base}cert/${element.Website}.cer`, element.CER);

  console.log(`http://${element.Website}:${element.Port}`);
});
*/

var multiserver = {
  Init: function () {
    switch (configdata.ssl) {
      //certbot
      case "L":


        break;
      case "O":
        //Own SSL

        break;
      //CloudFlare
      case "C":
      case "0":
        //No SSL - no spdy

        if (configdata.spdy == "1") {
          _.forEach(data, function (element) {

            Servers.push(
              {
                Server: http.createServer(app).listen(element.Port).withShutdown(),
                hostname: element.Website, Port: element.Port, IsRunning: true
              }
            )
            console.log(`No SSL - http://${element.Website}:${element.Port}`);
          });

          multiserver.WriteConfig(false);
        }
        else {
          console.log(`No spdy without SSL... :( `);
        }
        break;
    }

  },
  WriteConfig: function (withSSL) {
    var deftempnginx = ``;
    var deftempapache = ``;

    // nginx and apache
    if (configdata.webs == "A") {
      if (!withSSL) {
        _.forEach(data, function (element) {
          // Nginx
          deftempnginx += `include ${__base}private/nginx/${element.Website}.nginx.conf;\n`;
          var nginxtemp = `server\n{\nlisten 80;\nlisten [::]:80;\nserver_name ${element.Website} www.${element.Website};\nlocation /\n{\nproxy_pass http://localhost:${element.Port};\ninclude ${__base}private/nginx/proxy.nginx.conf;\n}\n}`;
          fs.writeFile(`${__base}private/nginx/${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private/apache/${element.Website}.apache.conf;\n`;
          var apachetemp = `<VirtualHost *:80>\nServerName ${element.Website}\nServerAlias www.${element.Website}\nProxyRequests Off\nProxyPreserveHost On\nProxyPass / http://localhost:${element.Port}/\nProxyPassReverse / http://localhost:${element.Port}/\n</VirtualHost>`;
          fs.writeFile(`${__base}private/apache/${element.Website}.apache.conf`, apachetemp);

        });
      }
      else {
        _.forEach(data, function (element) {
          // Nginx
          deftempnginx += `include ${__base}private/nginx/${element.Website}.nginx.conf;\n`;
          //   var nginxtemp = `server\n{\nlisten 80;\nlisten [::]:80;\nserver_name ${element.Website} www.${element.Website};\nlocation /\n{\nproxy_pass http://localhost:${element.Port};\ninclude ${__base}private/nginx/proxy.nginx.conf;\n}\n}`;
          // fs.writeFile(`${__base}private/nginx/${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private/apache/${element.Website}.apache.conf;\n`;
          //   var apachetemp = `<VirtualHost *:80>\nServerName ${element.Website}\nServerAlias www.${element.Website}\nProxyRequests Off\nProxyPreserveHost On\nProxyPass / http://localhost:${element.Port}/\nProxyPassReverse / http://localhost:${element.Port}/\n</VirtualHost>`;
          //   fs.writeFile(`${__base}private/apache/${element.Website}.apache.conf`, apachetemp);

        });

      }

      fs.writeFile(defnginx, deftempnginx);
      fs.writeFile(defapache, deftempapache);
      console.log(`Nginx config file- ${defnginx}`);
      console.log(`Apache config file- ${defapache}`);
    }
    else 
    {
      // nodejs proxy

    }
  },
  RestartAll: function () {
    multiserver.StopAll();
    multiserver.Init();
  },
  Restart: function (domain) {

  },
  Stop: function (domain) {
    _.forEach(data, function (element) {
      if (element.Website == domain) {
        element.Server.shutdown(function () {
          console.log(`${element.Website} shutdown.`);
        });
        element.IsRunning = false;
      }
    });
  },
  StopAll: function () {
    _.forEach(data, function (element) {
      element.Server.shutdown(function () {
        console.log(`${element.Website} shutdown.`);
      });
      element.IsRunning = false;
    });
  }
};

module.exports = multiserver;