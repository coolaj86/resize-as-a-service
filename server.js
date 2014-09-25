'use strict';

var  statik = require('serve-static')
  , connect = require('connect')
  , request = require('request')
  ,  crypto = require('crypto')
  ,    path = require('path')
  ,      fs = require('fs')
  ,      qs = require('qs')
  ;

module.exports = function(config) {
  var imagesFolder = config.imagesFolder || path.resolve('./images')
    ;

  var app = connect()
    .use(query)
    .use('/api/images', resize)
    .use('/images', statik(imagesFolder))
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
      handleError(400, "you must specify url={{url}}");
    }

    if (!width && !height) {
      handleError(400, "you must specify width={{width}} or height={{height}}");
    }

    request(url, {encoding: null}, function(err, resp, body) {
      if (err) { // TODO: make this behavior
        console.log('[ERROR GET]');
        console.error(err);
        console.error(body);

        handleError(500, "an unknown error occured when retriving your image");

        return;
      }

      if (resp.statusCode >= 400) {
        handleError(resp.statusCode,
                    "an unknown error occured when retriving your image");

        return;
      }

      var match = url.match(/\.(jpe?g|png|ico|gif|tiff?|jf?if)(?=[^.]*$)/i)
        ;

      if (!match) { // TODO: make this sound better
        handleError("file extension unknown", 400);
        return;
      }

      // TODO: sync .jp{,e}g and .j{,f}if
      var hash = crypto.createHash('md5').update(body).digest('hex')
        , extension = match[0].toLowerCase()
        , filepath = path.join(config.imagesFolder, hash + extension)
        ;

      handleImage(filepath, body);
    });

    // this is where the magic happens! (get it?)
    function handleImage(filepath, body) {
      fs.exists(filepath, function(exists) {
        if (exists) {
          fs.createReadStream(filepath).pipe(res); // TODO
        } else {
          fs.writeFile(filepath, body, function(err) {
            if (err) {
              // TODO
              console.error(err);
              handleError(500, "there was a problem writing the file");
              return;
            }

            handleImage(filepath, body);
          });
        }
      });
    }

    function handleError(code, message) {
      res.statusCode = code;

      // why are we responding with JSON when the client is expecting images and
      // probably has no way of parsing this JSON?
      res.end(JSON.stringify({
        error: {
          message: message
        }
      }));
    }
  }

  return app;
};
