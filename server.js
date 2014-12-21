'use strict';

var   crypto = require('crypto')
  ,  connect = require('connect')
  ,   statik = require('serve-static')
  ,    query = require('connect-query')
  ,     http = require('http')
  ,     path = require('path')
  ,  process = require('./process-image').process
  ;

module.exports.create = function (config) {
  config = config || {};

  var imagesFolder = config.imagesFolder || path.resolve(__dirname, 'images', 'resized')
    , originalsFolder = config.originalsFolder || path.resolve(__dirname, 'images', 'originals')
    , imagesRoute = config.imagesRoute || '/images'
    , apiRoute = config.apiRoute || '/api'
    //,  limit = config.limit || 255 * (1024) // 255kb
    ,    app = connect()
    ;

  function resize(req, res, next) {

    /*
    function redirect(fname) {
      var address = (config.href) + imagesRoute + '/' + fname
        ;

      res.writeHead(301, { Location: address });
      res.write(301 + ' ' + http.STATUS_CODES[301] + ' ' + address + '\n');

      res.end();
    }
    */

    function status(code) {
      res.statusCode = code;

      // why are we responding with JSON when the client is expecting images and
      // probably has no way of parsing this JSON?
      res.end(JSON.stringify({
        error: {
          message: '' + code + ' ' + http.STATUS_CODES[code]
        }
      }));
    }

    var          url = req.query.url
      ,         crop = req.query.crop || ''
      , targetFormat = (req.query.format || '').toLowerCase()
      ,      quality = (req.query.quality || null)
      ,        width = parseInt(req.query.w || 0, 10)
      ,       height = parseInt(req.query.h || 0, 10)
      ,      refresh = parseInt(req.query.refresh || 0, 10)
      ,        state = req.query.state || ''
      ,           id = url
                        + (state||'')
                        + (width||'')
                        + (height||'')
                        + (crop||'')
                        + (targetFormat||'')
                        + (quality||'')
      ,         hash = crypto.createHash('md5').update(id).digest('hex')
      ,      origsum = crypto.createHash('md5').update(url + (state||'')).digest('hex')
      ,        match = url.match(/\.(jpe?g|png|ico|gif|tiff?|jf?if)(?=[^.]*$)/i)
      ,         conf
      ,         opts
      ;

    if (!url) {
      status(422);

      return;
    }

    // security check
    if (/\.\./.test(url)) {
      console.error('[resize-as-a-servize] attack? ' + url);
      next(); // TODO: fix this behavior

      return;
    }

    if (isNaN(width) || isNaN(height)) {
      status(422);

      return;
    }

    if (!match) {
      status(415);

      return;
    }

    if ('bmp' === targetFormat) {
      status(422);

      return;
    }

    conf = {
      imagesFolder: imagesFolder
    , originalsFolder: originalsFolder
    };
    opts = {
      width: width
    , height: height
    //, crop: crop
    , originalFilename: origsum
    , targetBaseName: hash
    , targetFormat: targetFormat
    , quality: quality
    , refresh: refresh
    , state: state
    };
    return process(conf, url, opts).then(function (data) {
      // TODO use different routes
      req.originalUrl = imagesRoute + '/' + data.filename;
      req.url = '/' + imagesRoute + '/' + data.filename;
      next();

      return;
    }).error(function (err) {
      console.error('[e] resize 1');
      console.error(err);
      status(500);

      throw err;
    });
  }

  app
    .use(query())
    .use(apiRoute, resize)
    // resized
    .use(apiRoute + imagesRoute, statik(imagesFolder))
    .use(imagesRoute, statik(imagesFolder))
    // originals
    .use(apiRoute + imagesRoute, statik(originalsFolder))
    .use(imagesRoute, statik(originalsFolder))
    ;

  return app;
};
