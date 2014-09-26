'use strict';

var  statik = require('serve-static')
  , connect = require('connect')
  , request = require('request')
  ,  crypto = require('crypto')
  ,    http = require('http')
  ,    path = require('path')
  ,      fs = require('fs')
  ,      qs = require('qs')
  ,      gm = require('gm')
  ;

module.exports = function(config) {
  var images = config.imagesFolder || path.resolve('./images')
    ,  limit = config.limit || 0x2ffff // 255kb
    ;

  var app = connect()
    .use(query)
    .use('/api/images', resize)
    .use('/images', statik(images))
    ;

  function query(req, res, next) {
    if (req.query) {
      next();
      return;
    }

    var parts = req.url.split('?')
      ;

    if (parts.length) {
      req.query = qs.parse(parts[1]);
    } else {
      req.query = {};
    }

    next();
  }

  function resize(req, res, next) {
    var    url = req.query.url
      ,  width = req.query.w
      , height = req.query.h
      ;

    // security check
    if (/\.\./.test(url)) {
      console.log('[resize-as-a-servize] attack? ' + url);
      next(); // TODO: fix this behavior
      return;
    }

    if (!url) {
      status(422);
    }

    if (isNaN(+width) || isNaN(+height)) {
      status(422);
    }

    var match = url.match(/\.(jpe?g|png|ico|gif|tiff?|jf?if)(?=[^.]*$)/i)
      ;

    if (!match) {
      status(415);

      return;
    }

    // TODO: sync .jp{,e}g and .j{,f}if
    var extension = match[0].toLowerCase()
      ,        id = url + width + height
      ,      hash = crypto.createHash('md5').update(id).digest('hex')
      ,  filename = hash + extension
      ,  filepath = path.resolve(images, filename)
      ;

    fs.exists(filepath, function(exists) {
      if (exists) {
        redirect();
      } else {
        create();
      }
    });

    function write(image) {
      gm(image)
        .resize(+width, +height)
        .noProfile()
        .write(images + filename, function(err) {
          if (err) {
            console.error(err);
            status(500);

            return
          }

          redirect();
        });
    }

    function create() {
      request(url, {encoding: null}, function(err, resp, body) {
        if (err) {
          console.error(err);
          status(500);

          return;
        }

        if (resp.statusCode >= 400) {
          status(resp.statusCode);

          return;
        }

        if (body.length > limit) {
          status(413);
        }

        write(body);
      });
    }

    function redirect() {
      var address = config.href + 'images/' + filename
        ;

      res.writeHead(301, { Location: address });
      res.write('' + 301 + ' ' + http.STATUS_CODES[301] + ' ' + address + '\n');

      res.end();
    }

    function status(code, message) {
      res.statusCode = code;

      // why are we responding with JSON when the client is expecting images and
      // probably has no way of parsing this JSON?
      res.end(JSON.stringify({
        error: {
          message: '' + code + ' ' + http.STATUS_CODES[code]
        }
      }));
    }
  }

  return app;
};
