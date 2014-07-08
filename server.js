'use strict';

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var config = require('./config')
  , connect = require('connect')
  , crypto = require('crypto')
  , qs = require('qs')
  , serveStatic = require('serve-static')
  //, escapeRegExp = require('escape-regexp')
  , fs = require('fs')
  , app = connect()
  , path = require('path')
  , querystring = require('querystring')
  , request = require('request')
  , fs = require('fs')
  , imageBaseUrl = config.href
  , imageBaseRe = new RegExp(escapeRegExp('^' + imageBaseUrl), 'i')
  , googleBaseUrl = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy'
  , imagesDir = path.join(__dirname, 'images')
  , pagesDir = path.join(__dirname, 'public')
  , urlrouter = require('connect_router')
  , urlquery = function query(options){
      return function query(req, res, next){
        if (req.query) {
          next();
          return;
        }

        var index
          ;

        index = req.url.indexOf('?');
        req.query = (-1 !== index)
          ? qs.parse(req.url.substr(index + 1).query, options)
          : {}
          ;

        next();
      };
    }
  ;

// ?container=focus&resize_w=192&url={{myImage || 'http://placehold.it/150x150'}}

function route(rest) {
  function resize(req, res, next) {
    // security check
    if (/\.\./.test(req.url)) {
      next();
      return;
    }

    if (!req.query.url || (!req.params.width && !req.params.height)) {
      res.end(JSON.stringify({ error: { message: "you must specify url={{url}} and height or width" } }));
      return;
    }

    var externalUrl = req.query.url
      , hash = crypto.createHash('md5').update(req.query.url).digest('hex')
      , extMatch = req.query.url.match(/\.(jpe?g|png|ico|gif|tiff?|jf?if)(?=[^.]*$)/i)
      , extension = (extMatch && extMatch[0] || '').toLowerCase()
      , filename = hash + extension
      , filepath = path.join(imagesDir, filename)
      , internalUrl = imageBaseUrl + filename
      ;

    function redirectToGoogle(url, params) {
      // We let google download from us the image we saved
      // and then google serves it at the size the user requested
      var query
        , googleUrl
        ;
        
      query = {
        container: 'focus'
      , url: internalUrl
      };
      if (params.width) {
        query.resize_w = params.width;
      } else {
        query.resize_h = params.height;
      }
      googleUrl = googleBaseUrl + '?' + querystring.stringify(query);

      res.statusCode = 302;
      res.setHeader('Location', googleUrl);
      res.end('Redirecting to ' + googleUrl);
    }

    // Handle the case of an image being served to itself
    // http://images.example.com/api/resize/width/400?url=http://images.example.com/abc0123.jpg
    if (imageBaseRe.test(externalUrl)) {
      redirectToGoogle(externalUrl, req.params);
      return;
    }

    function downloadExternalImage(url) {
      request(
        { method: 'GET'
        , uri: url
        , encoding: null
        , headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:29.0) Gecko/20100101 Firefox/29.0'
          , 'Referer': (url.match(/https?:\/\/[^\/]+/i)||[])[0] || undefined
          }
        }
      , function (err, resp, body) {
          if (err || resp.statusCode >= 400) {
            console.error('[ERROR GET]');
            console.error(err);
            console.error(body);
            res.statusCode = resp && resp.statusCode || 500;
            res.end(body);
            return;
          }

          fs.writeFile(filepath, body, function (err) {
            if (err) {
              console.error('[ERROR SAVE]');
              console.error(err);
              console.error(body);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: { message: "an unknown error occured saving the retrieved the file " } }));
            }

            redirectToGoogle(internalUrl, req.params);
          });
        }
      );
    }

    fs.exists(filepath, function (exists) {
      if (exists) {
        redirectToGoogle(internalUrl, req.params);
        return;
      }
      
      downloadExternalImage(externalUrl);
    });

    /*
    function downloadGoogleImage() {
      request({ method: 'GET', uri: url, encoding: null }, function (err, resp, body) {
        fs.writeFile(path.join(__dirname, path.resolve(req.url)), body, function (err) {
          if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: {} }));
          }
        });

        setTimeout(next, 100);
      });
    }
    */
  }
  rest.get('/resize/width/:width', resize);
  rest.get('/resize/height/:height', resize);
}

app
  // TODO download resized image from Google
  // TODO mangle URL and pass to local static server
  .use(urlquery())
  .use('/api', urlrouter(route))
  .use('/', serveStatic(imagesDir))
  .use('/', serveStatic(pagesDir))
  ;

module.exports = app;
