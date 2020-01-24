var JsonDB = require('node-json-db'),
  colors = require('colors'),
  spdy = require('spdy'),
  http = require('http'),
  path = require('path'),
  httpProxy = require('http-proxy'),
  https = require('https'),
  _ = require('lodash'),
  fs = require('fs-extra'),
  ip = require('ip'),
  app = require(`${__base}app/app.js`),
  edge = require('edge.js'),
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
          server.listen(443,'::1');
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
                Server: http.createServer(app).listen(element.Port == 0 ? element.Port : element.Socket).withShutdown(),
                hostname: element.Website, Port: element.Port, IsRunning: true, Socket:element.Socket
              }
            )
            console.log(`INFO-01- ${configdata.ssl == "0" ? "No SSL" : "Cloudflare"} - HTTP 1.1 -  http://${element.Website} --> ${element.Port == 0 ? "http://127.0.0.1:"+element.Port : element.Socket }`.yellow);
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
            server.listen(80,'::1');
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
          //TODO IPV6
          const data={ element:element, path:__base, pathsep:path.sep,spdy:configdata.spdy,localipv4:ip.address(),localipv6:ip.address()};
                
          // Nginx
          deftempnginx += `include ${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf;\n`;
          
          var template=fs.readFileSync(`${__base}private${path.sep}nginx${path.sep}template.http.conf`,"utf8");
          var nginxtemp = edge.renderString(template, data);
          fs.writeFile(`${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf;\n`;
          template=fs.readFileSync(`${__base}private${path.sep}apache${path.sep}template.http.conf`,"utf8");
          
          var apachetemp = edge.renderString(template, data);
          fs.writeFile(`${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf`, apachetemp);

        });
      }
      else {
        _.forEach(lstWebsites, function (element) {
              //TODO IPV6
          const data={ element:element, path:__base, pathsep:path.sep,spdy:configdata.spdy,localipv4:ip.address(),localipv6:ip.address()};
      
          // Nginx
          deftempnginx += `include ${__base}private${path.sep}nginx${path.sep}${element.Website}.nginx.conf;\n`;
          const template=fs.readFileSync(`${__base}private${path.sep}nginx${path.sep}template.https.conf`,"utf8");
       
          var nginxtemp = edge.renderString(template, data);
          fs.writeFile(`${__base}private/nginx/${element.Website}.nginx.conf`, nginxtemp);

          // apache
          deftempapache += `Include ${__base}private${path.sep}apache${path.sep}${element.Website}.apache.conf;\n`;
          template=fs.readFileSync(`${__base}private${path.sep}apache${path.sep}template.https.conf`,"utf8");
      
          var apachetemp =  edge.renderString(template, data);
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