global.__base = __dirname + '/';

var JsonDB = require('node-json-db'),
    spdy = require('spdy'),
    _ = require('lodash'),
    app = require((`${__base}app/app.js`),
    dbwebsites = new JsonDB(`${__base}db/cmswebsites`, true, false));


var data = dbwebsites.getData("/");

// create each webserver per domain

_.forEach(data, function (element) {

    var options = { key: element.RSA, cert: element.CER };

    spdy.createServer(options, app)
    .listen( element.Port, (error) => {
    if (error) {
      console.error(error)
      return process.exit(1)
    } else {
      console.log(`Node-CMS ${element.Website} on ${element.Port} Ready. Have a nice day ;)`)
    }
  });
});



/*
app.set('port', port);

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('NodeCms on ' + bind + ' Have a nice day ;)');
}
*/
