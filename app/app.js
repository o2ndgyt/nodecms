var logger = require('morgan'),
  expressedge = require('express-edge'),
  compression = require('compression'),
  express = require('express'),
  helmet = require('helmet'),
  JsonDB = require('node-json-db'),
  useragent = require('express-useragent'),
  robots = require('express-robots-txt'),
  cookieParser = require('cookie-parser'),
  validator = require('express-validator'),
  session = require('express-session'),
  passport=require('passport'),
  rateLimit = require("express-rate-limit"),
  ipgeoblock = require(`${__base}app/routers/geoip.js`),
  flash=require('connect-flash'),
  csrf = require('csurf'),
  RouterAdmin = require(`${__base}app/routers/routeradmin.js`),
  DbFunc = require(`${__base}app/routers/dbfunc.js`),
  db = new JsonDB(`${__base}db/config`, true, false);

var configdata = db.getData("/");

var app = express();

var csrfProtecion = csrf();
app.use(csrfProtecion);


// User agent
app.use(useragent.express());

// Robots
app.use(robots(`${__base}public/robots.txt`));

// Defense
app.use(helmet());

// Compress
app.use(compression({ level: configdata.GZip }));

// Template engine
app.use(expressedge);
app.set('views', `${__base}views`);

// Change X-Powered-By
app.use(function (req, res, next) {
  res.setHeader('X-Powered-By', configdata.XPowerBy)
  next()
})

// Set public folder
app.use(express.static('public'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session(
  {
    secret: 'Ku7VEtyc2B8mHFwrEpV6CAQtxGLySuLc',
    resave: false,
    saveUninitialized: false,
    // millisec expired
    cookie: { maxAge: 180 * 60 * 1000 }
  }));

const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200
  });

// defender
app.use(apiLimiter);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


//global variables
app.use( function (req,res,next){
  res.locals.login=req.isAuthenticated();
  res.locals.session=req.session;
  next();
});


// ip/country defense
app.use(ipgeoblock({
  geolite2: `${__base}geoip/geoip.mmdb`,
  blocked: configdata.WebBIPS,
  blockedCountries: configdata.WebBCo
}, function (req, res) {	
 res.statusCode = 401;
  res.end("Your ip ("+req.location.ip+") is on blacklist. Access Denied.");
}));

// Admin routers
app.use('/admin',ipgeoblock({
  geolite2: `${__base}geoip/geoip.mmdb`,
  allowed:  configdata.AdminAIPS,
  allowedCountries: configdata.AdminACo
}, function (req, res) {
  res.statusCode = 401;
  res.end("Your ip ("+req.location.ip+") is on blacklist. Access Denied.");
}), RouterAdmin);



// URLs ENGINE with multi lang
app.use(function (req, res, next) {

  var strLangId = DbFunc[configdata.DB+"_GetLangId"](simpleLanguage(req));
  var strWebsiteId = DbFunc[configdata.DB+"_GetWebsiteId"](req.hostname);
  // check hostname
  if (strWebsiteId !="*")
  {
     // check exact url
     var blnOk=true;
     var strRouterId=DbFunc[configdata.DB+"_GetRouterId"](strLangId,req.originalUrl,req.hostname);
     if (typeof(strRouterId) === 'object')
     {
        blnOk=false;
        res.send(comfunc.UrlEngine(strRouterId,strWebsiteId,req.location.country.isoCode));
     }
     else
     {      
          // check non-exact url (for eaxmple /video/:id0 or /video/:id0/:id1 etc)
          var lstPath=req.originalUrl.split("/");
          if (lstPath.length>1)
          {
              for (var i = lstPath.length; i >1; i--)
              { 
                 for (var x=lstPath.length-i;x>-1;x--)
                 {
                    lstPath[lstPath.length-x-1]=`:id${x}`;
                    var strRouterId=DbFunc[configdata.DB+"_GetRouterId"](strLangId,lstPath.join(""),req.hostname);
                    if (typeof(strRouterId) === 'object')
                    {
                       blnOk=false;
                       res.send(comfunc.UrlEngine(strRouterId,strWebsiteId,req.location.country.isoCode));
                    }
                 }
              }
          }
     }  
     if (blnOk)
     {
        // error page 404
        res.status(err.status || 404);
        var strRouterId=DbFunc[configdata.DB+"_GetRouterId"](strLangId,"404",req.hostname);
        if (typeof(strRouterId) === 'object')
        {
           res.send(comfunc.UrlEngine(strRouterId,strWebsiteId,req.location.country.isoCode));
        }
        else
        { 
          res.json({
            msg: `Website:${req.hostname} Langid:${strLangId} Url:${req.originalUrl} not registered.`,
            status: 404
        });      
        }
     }   
  }
  else
  {
    res.status(err.status || 404);

    res.json({
      msg: `Website:${req.hostname} not registered.`,
      status: 404
  });

  }
  

});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  res.json({
    msg: err.message,
    stack:err.stack,
    status: 500
});

 
});

module.exports = app;
