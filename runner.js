'use strict';

var resizer = require('./server')
  , http = require('http')
  , server
  , config = require('./config')
  ;

config.protocol = 'http:';
config.port = config.port || process.argv[2] || 5050;
config.href = config.protocol + '//' + config.hostname;
if ('80' !== String(config.port)) {
  config.href = config.href + ':' + config.port;
}
config.href += '/';

server = http.createServer(resizer);
server.listen(config.port, function () {
  console.log('Listening on', server.address());
});
