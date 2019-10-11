var path = require('path'),
    colors = require('colors');

global.__base = __dirname + path.sep;

var multiserver = require(`${__base}app/multiserver.js`);
multiserver.Init();

console.log("INFO-XX-Node-CMS by ndg.yt Ready. Have a nice day ;)".blue);