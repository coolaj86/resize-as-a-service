'use strict';

var resizer = require('./server')
  , connect = require('connect')
  , config = require('./config')
  ;

config.protocol = 'http:';
config.port = config.port || process.argv[2] || 5050;
config.href = config.protocol + '//' + config.hostname;

if ('80' !== String(config.port)) {
  config.href = config.href + ':' + config.port;
}

config.href += '/';

connect()
  .use(resizer(config))
  .listen(config.port, function() {
    console.log('Listening on port ' + config.port);
  });
