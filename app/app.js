//var createError = require('http-errors');
//var validator = require('express-validator');
//var expressHsb = require('express-handlebars');
//var session=require('express-session');

var path = require('path');
var logger = require('morgan');
var expressedge=require('express-edge');
var compression = require('compression')
var express = require('express');
var helmet = require('helmet');
var JsonDB=require('node-json-db');
var useragent = require('express-useragent');
var robots= require('express-robots-txt');
var cookieParser = require('cookie-parser');
var validator = require('express-validator');
var session=require('express-session');

var validUrl = require('valid-url');

//Read config
var db = new JsonDB("./db/config", true, false);
try {
    var configdata = db.getData("/");
} catch(error) {
    console.error(error);
};

var RouterAdmin = require('../app/routers/RouterAdmin'); 

var app = express();

// User agent
app.use(useragent.express());

// Robots
app.use(robots(path.join(__dirname, '../public/robots.txt')));

// Defense
app.use(helmet());

// Compress
app.use(compression({level:configdata.GZip}));

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
  {secret:'Ku7VEtyc2B8mHFwrEpV6CAQtxGLySuLc',
  resave:false, 
  saveUninitialized:false,
  // millisec expired
  cookie: { maxAge: 180 *60*1000}
}));



// Admin routers
app.use('/admin', RouterAdmin); 


// default page
app.get('/',function(req, res) {
 // res.render('index');
 res.send('ok');
});

 
// Content
app.get('/:url',function(req, res) {
  res.render('index', {url: req});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('404', {url: req.originalUrl});
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  
  res.render('error', { error:err.message});
});

module.exports = app;
