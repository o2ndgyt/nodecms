var JsonDB = require('node-json-db'),
  colors = require('colors'),
  spdy = require('spdy'),
  http = require('http'),
  path = require('path'),
  httpProxy = require('http-proxy'),
  https = require('https'),
  _ = require('lodash'),
  fs = require('fs-extra'),
  app = require(`${__base}app/app.js`),
  db = new JsonDB(`${__base}db/config`, true, false),
  DbFunc = require(`${__base}app/routers/dbfunc.js`);

require('http-shutdown').extend();

var Servers = [];
var configdata = db.getData("/");
var lstWebsites = DbFunc[configdata.DB + "_ListWebsites"](2);
var defnginx = `${__base}private${path.sep}nginx${path.sep}default.nginx.conf`;
var defapache = `${__base}private${path.sep}apache${path.sep}default.apache.conf`;

var multiserver = {
  Init: function () {
    switch (configdata.ssl) {
      //certbot
      case "L":
      case "O":
        //Own SSL

        _.forEach(lstWebsites, function (element) {
          fs.writeFile(`${__base}cert${path.sep}${element.Website}.rsa`, element.RSA);
          fs.writeFile(`${__base}cert${path.sep}${element.Website}.cer`, element.CER);
          fs.writeFile(`${__base}cert${path.sep}${element.Website}.pem`, element.CA);
          var options = { key: element.RSA, cert: element.CER, ca: element.CA };

          Servers.push(
            {
              Server: configdata.spdy == "1" ? https.createServer(options, app).listen(element.Port).withShutdown() :
                spdy.createServer(options, app).listen(element.Port).withShutdown(),
              hostname: element.Website, Port: element.Port, IsRunning: true
            }
          )
          console.log(`INFO-01- Own SSL HTTP ${configdata.spdy == "1" ? "1.1" : "2"} -  https://${element.Website} --> https://127.0.0.1:${element.Port}`.yellow);
        });

        if (configdata.webs == "A") {
          multiserver.WriteConfig(true);
          console.log("INFO-05-Nginx/Apache is listening".green)
        }
        else {
          // proxy
          var proxy = httpProxy.createProxyServer({});
          var server = configdata.spdy == "1" ? https.createServer(function (req, res) {
            var blnFound = true;
            _.forEach(lstWebsites, function (element) {
              if (element.Website == req.headers.host) {
                proxy.web(req, res, {
                  target: 'https://127.0.0.1:' + element.Port,
                  secure: true, ssl: { key: element.RSA, cert: element.CER, ca: element.CA }
                });
                blnFound = false;
              }
            });

            if (blnFound) {
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.write(`${req.headers.host} unconfigured`);
              res.end();
            }
          }) :
            spdy.createServer(function (req, res) {
              var blnFound = true;
              _.forEach(lstWebsites, function (element) {
                if (element.Website == req.headers.host) {
                  proxy.web(req, res, {
                    target: 'https://127.0.0.1:' + element.Port,
                    secure: true, ssl: { key: element.RSA, cert: element.CER, ca: element.CA }
                  });
                  blnFound = false;
                }
              });

              if (blnFound) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(`${req.headers.host} unconfigured`);
                res.end();
              }
            });

          console.log("INFO-05-Proxy server is listening on port 443".green)
          server.listen(443);
        }
        break;
      //CloudFlare
      case "C":
      case "0":
        //No SSL - no spdy

        if (configdata.spdy == "1") {
          _.forEach(lstWebsites, function (element) {

            Servers.push(
              {
                Server: http.createServer(app).listen(element.Port).withShutdown(),
                hostname: element.Website, Port: element.Port, IsRunning: true
              }
            )
            console.log(`INFO-01- ${configdata.ssl == "0" ? "No SSL" : "Cloudflare"} - HTTP 1.1 -  http://${element.Website} --> http://127.0.0.1:${element.Port}`.yellow);
          });

          if (configdata.webs == "A") {
            multiserver.WriteConfig(false);
            console.log("INFO-05-Nginx/Apache is listening".green)
          } else {
            // proxy
            var proxy = httpProxy.createProxyServer({});
            var server = http.createServer(function (req, res) {
              var blnFound = true;
              _.forEach(lstWebsites, function (element) {
                if (element.Website == req.headers.host) {
                  proxy.web(req, res, { target: 'http://127.0.0.1:' + element.Port });
                  blnFound = false;
                }
              });

              if (blnFound) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(`${req.headers.host} unconfigured`);
                res.end();
              }
            });


            console.log("INFO-05-Nodejs is listening on port 80".green)
            server.listen(80);
          }
        }
        else {
          console.log(`ERROR-01-No spdy without SSL... :( `.red);
          process.exit(1);
        }
        break;
    }

  },
  WriteConfig: function (withSSL) {
    var deftempnginx = `include ${__base}private${path.sep}nginx${path.sep}proxy.nginx.conf;\n`;
    var deftempapache = "";

    // nginx and apache
    if (configdata.webs == "A") {
      if (!withSSL) {
        _.forEach(lstWebsites, function (element) {
          // Nginx
          deftempnginx += `include ${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf;\n`;
          var nginxtemp = ``;
          fs.writeFile(`${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf;\n`;
          var apachetemp = ``;
          fs.writeFile(`${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf`, apachetemp);

        });
      }
      else {
        _.forEach(lstWebsites, function (element) {

          // Nginx
          deftempnginx += `include ${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf;\n`;

          var nginxtemp = ``;
          fs.writeFile(`${__base}private/nginx/${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf;\n`;
var apachetemp = `
<VirtualHost *:443>\n
    SSLEngine on\n
    SSLCertificateFile ${__base}cert${path.sep}${element.Website}.cer\n
    SSLCertificateKeyFile ${__base}cert${path.sep}${element.Website}.rsa\n

    ${configdata.spdy == "1" ? "  SSLProtocol all -SSLv2 -SSLv3\n" : " SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1\nProtocols h2 h2c http/1.1"}    
  
   
    
    SSLHonorCipherOrder on\n
    SSLCipherSuite "EECDH+ECDSA+AESGCM EECDH+aRSA+AESGCM\n
    EECDH+ECDSA+SHA384 EECDH+ECDSA+SHA256 EEDH+aRSA+SHA384\n
    EECDH+aRSA+SHA256 EECDH+aRSA+RC4\n
    EECDH EDH+aRSA RC4 !aNULL !eNULL !LOW !3DES !MD5 !EXP !PSK !SRP !DSS"\n

    ServerAdmin admin@${element.Website}\n
    ServerName ${element.Website} www.${element.Website}\n
    ProxyPassReverse / http://localhost:${element.Port}/\n
    ProxyPass / http://localhost:${element.Port}/\n
    ProxyPreserveHost on\n
    ProxyRequests Off\n
    Header always append Access-Control-Allow-Origin: "${element.Website}"\n
</VirtualHost>
`;

             fs.writeFile(`${__base}private/apache/${element.Website}.apache.conf`, apachetemp);
        });

      }

      fs.writeFile(defnginx, deftempnginx);
      fs.writeFile(defapache, deftempapache);
      console.log(`INFO-02-Nginx config file- ${defnginx}`.yellow);
      console.log(`INFO-03-Apache config file- ${defapache}`.yellow);
    }
    else {
      // nodejs proxy
      console.log(`INFO-02/03-Nodejs http server ready.`.green);
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