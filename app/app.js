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
var validUrl = require('valid-url');

//Read config
var db = new JsonDB("./db/config", true, false);
try {
    var configdata = db.getData("/");
} catch(error) {
    console.error(error);
};

var RouterAdmin = require('../app/routers/RouterAdmin'); 
var comfunc = require('../app/comfunc');

var app = express();

//User agent
app.use(useragent.express());

// defense
app.use(helmet());

// compress
app.use(compression({level:configdata.GZip}));

//Template
app.use(expressedge);
app.set('views', path.join(__dirname, '../views'));

//Change X-Powered-By
app.use(function (req, res, next) {
  res.setHeader('X-Powered-By', configdata.XPowerBy)
  next()
})

//Set public folder
app.use(express.static('public'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Admins routers
app.use('/admin', RouterAdmin); 


// default page
app.get('/',function(req, res) {
 // res.render('index');
 res.send('ok');
});

// default page
app.get('/api/test',function(req, res) {

  var dbads = new JsonDB("./db/cmsad", true, false);
  
  
  res.send(result);
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
