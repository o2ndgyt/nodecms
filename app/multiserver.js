var JsonDB = require('node-json-db'),
    spdy = require('spdy'),
    http = require('http'),
    https = require('https'),
    _ = require('lodash'),
    fs = require('fs-extra'),
    app = require(`${__base}app/app.js`),
    db = new JsonDB(`${__base}db/config`, true, false),
    dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false);

var Servers=[];

var configdata = db.getData("/");

var multiserver = {
  Init: function ()
  {
    switch (configdata.ssl)
    {
        //CloudFlare
        case "C":
            switch (configdata.webs)
            {
                case "A":
                    // apache
                    break;
                case "N":
                    // nginx
                    break;
                case "0":
                    // nodejs 
                break;
            }
        
        break;
        //certbot
        case "L": 
        switch (configdata.webs)
        {
            case "A":
                // apache
                break;
            case "N":
                // nginx
                break;
            case "0":
                // nodejs 
            break;
        }

        break;
        case "O": 
        //Own SSL
        switch (configdata.webs)
        {
            case "A":
                // apache
                break;
            case "N":
                // nginx
                break;
            case "0":
                // nodejs 
            break;
        }

        break;
        case "0": 
        //No SSL
        switch (configdata.webs)
        {
            case "A":
                // apache
                break;
            case "N":
                // nginx
                break;
            case "0":
                // nodejs 
            break;
        }
        break;
    }  
    

    var data = dbwebsites.getData("/");
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
  },
  RestartAll: function () {
        multiserver.StopAll();
        multiserver.Init();
  },
  StopAll : function () {

  }
};

module.exports = multiserver;