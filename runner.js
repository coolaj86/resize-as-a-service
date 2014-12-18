'use strict';

var http = require('http')
  , resizer = require('./server')
  , connect = require('connect')
  , app
  , config = require('./config')
  , server
  ;

config.protocol = 'http:';
config.port = config.port || process.argv[2] || 8080;
config.href = config.protocol + '//' + config.hostname;

if ('80' !== String(config.port)) {
  config.href = config.href + ':' + config.port;
}

config.href += '/';

app = connect();
app.use(resizer.create(config));

server = http.createServer(app);
server.listen(config.port, function() {
  console.log('Listening on port ' + config.port);
});
