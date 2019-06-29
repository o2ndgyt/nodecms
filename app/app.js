//var createError = require('http-errors');

var path = require('path'),
  logger = require('morgan'),
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
  simpleLanguage = require('simple-accept-language'),
  dburls = new JsonDB("./db/cmsurls", true, false),
  db = new JsonDB("./db/config", true, false),
  dblangs = new JsonDB("./db/cmslangs", true, false),
  dburls = new JsonDB("./db/cmsurls", true, false),
  comfunc = require("../app/comfunc"),
  RouterAdmin = require('../app/routers/RouterAdmin'),
  rateLimit = require("express-rate-limit"),
  ipgeoblock = require("node-ipgeoblock"),
  flash=require('connect-flash'),
  passport=require('passport');

try {
  var configdata = db.getData("/");
} catch (error) {
  console.error(error);
};


var app = express();

// User agent
app.use(useragent.express());

// Robots
app.use(robots(path.join(__dirname, '../public/robots.txt')));

// Defense
app.use(helmet());

// Compress
app.use(compression({ level: configdata.GZip }));

// Template engine
app.use(expressedge);
app.set('views', path.join(__dirname, '../views'));

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
    max: 50
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
  geolite2: "./geoip/geoip.mmdb",
  blocked: configdata.WebBIPS,
  blockedCountries: configdata.WebBCo
}, function (req, res) {	
 res.statusCode = 401;
  res.end("Your ip on blacklist. Access Denied");
}));

// Admin routers
app.use('/admin',ipgeoblock({
  geolite2: "./geoip/geoip.mmdb",
  allowed:  configdata.AdminAIPS,
  allowedCountries: configdata.AdminACo
}, function (req, res) {
  res.statusCode = 401;
  res.end("Your ip on blacklist. Access Denied");
}), RouterAdmin);



// URLs ENGINE with multi lang
app.use(function (req, res, next) {

  var blnOk = false;
  dburls.reload();
  dblangs.reload();
  var strLang = "*";

  // search langid
  var result = dblangs.getData("/").findIndex(item => item.Code === simpleLanguage(req));
  if (result > -1) {
    strLang = dblangs.getData("/" + result).Id;
  }

  // home page
  if (req.originalUrl === '/') {
    // home page with lang
    var result = dburls.getData("/").findIndex(item => item.Type === "Home" && item.Lang === strLang);
    if (result > -1) {
      // home page with lang
      res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
    }
    else {
      if (strLang != "*") {
        // home page without lang
        var result = dburls.getData("/").findIndex(item => item.Type === "Home" && item.Lang === "*");
        if (result > -1) {
          res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
        }
        else {
          // no homepage -> error
          blnOk = true;
        }
      }
      else {
        // no homepage -> error
        blnOk = true;
      }

    }
  }
  else {
    // sub page
    var result = dburls.getData("/").findIndex(item => item.Type === "Page" && item.Lang === strLang && item.PageFullUrl === "/" + req.originalUrl);
    if (result > -1) {
      // home page with lang
      res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
    }
    else {
      if (strLang != "*") {
        // page without lang
        var result = dburls.getData("/").findIndex(item => item.Type === "Page" && item.Lang === "*" && item.PageFullUrl === "/" + req.originalUrl);
        if (result > -1) {
          res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
        }
        else {
          // no page -> error
          blnOk = true;
        }
      }
      else {
        // no homepage -> error
        blnOk = true;
      }

    }

  }

  // error page
  if (blnOk) {
    res.status(err.status || 404);
    var result = dburls.getData("/").findIndex(item => item.Type === "404" && item.Lang === strLang);
    if (result > -1) {
      // home page with lang
      res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
    }
    else
    {
      if (strLang != "*") {
        // 404 without lang
        var result = dburls.getData("/").findIndex(item => item.Type === "404" && item.Lang === "*");
        if (result > -1) {
          res.send(comfunc.UrlEngine(dburls.getData("/" + result).BodyID, strLang));
        }
        else {
          // no error page
          res.json({
            msg: req.originalUrl+" not found, no error page definied",
            status: 404
        });
        }
      }
      else {
       // no error page
       res.json({
        msg: req.originalUrl+" not found, no error page definied",
        status: 404
    });
      }

    }
   
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
