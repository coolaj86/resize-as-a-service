'use strict';

var PromiseA = require('bluebird').Promise
  ,  request = require('request')
  , requestA = PromiseA.promisify(request)
  ,     path = require('path')
  ,       fs = PromiseA.promisifyAll(require('fs'))
  ,       gm = require('gm')
  ;

function process(conf, url, opts) {
  var     origpath = path.resolve(conf.imagesFolder, opts.originalFilename)
    ,       height = opts.height
    ,        width = opts.width
    , targetFormat = opts.targetFormat
    //, originalFilename = origsum
    //, targetBaseName: hash
    //,      crop
    //,  filename
    ;

  /*
  // TODO: sync .jp{,e}g and .j{,f}if
  //sourceFormat = match && match[1].toLowerCase().replace(/(jpe?g|jf?if)/i, 'jpg');
  if ('bmp' === sourceFormat) {
    targetFormat = targetFormat || 'jpg';
  }
  */


  function retrieveOriginal(ourl, linkpath) {
    console.log('ourl, linkpath');
    console.log(ourl, linkpath);

    // fs.existsAsync is reverse because error fires when exists is true
    return fs.existsAsync(linkpath).then(function (/*exists = false*/) {
      return requestA(ourl, { encoding: null }).spread(function (resp, body) {
        if (resp.statusCode >= 400) {
          return PromiseA.reject(resp.statusCode);
        }

        /*
        if (body.length > limit) {
          status(413);

          return;
        }
        */

        return retrieveResized(linkpath, null, body);
      });
    }).error(function (/*exists = true*/) {
      // TODO put linkpath into db
      return fs.readFileAsync(linkpath, 'utf8').then(function (realname) {
        return retrieveResized(linkpath, realname, null);
      });
    });
  }

  function retrieveResized(linkpath, realname, body) {
    var realpath
      , n
      ;

    if (realname) {
      realpath = path.resolve(conf.imagesFolder, realname);
      n = fs.readFileAsync(realpath);
    } else if (body) {
      n = PromiseA.resolve(body);
    }

    return n.then(function (blob) {
      var image = gm(blob)
        ;

      image.formatAsync = PromiseA.promisify(image.format);
      image.sizeAsync = PromiseA.promisify(image.size);
      image.writeAsync = PromiseA.promisify(image.write);

      return image.formatAsync().then(function(sourceFormat) {
        sourceFormat = (sourceFormat||'')
          .toLowerCase()
          .replace(/(jpe?g|jf?if)/i, 'jpg')
          ;

        var filename = opts.targetBaseName + '.' + (targetFormat || sourceFormat)
          , newpath = path.resolve(conf.imagesFolder, filename)
          , isNewFormat = targetFormat && (targetFormat !== sourceFormat)
          , n
          ;

        if (!realpath) {
          realpath = linkpath + '.' + sourceFormat;
          n = fs.writeFileAsync(realpath, blob).then(function () {
            return fs.writeFileAsync(linkpath, opts.originalFilename + '.' + sourceFormat, 'utf8');
          });
        } else {
          n = PromiseA.resolve();
        }

        return n.then(function () {
          console.log('isNewFormat', isNewFormat, targetFormat);

          // fs.existsAsync is reverse because error fires when exists is true
          return fs.existsAsync(newpath).then(function (/*exists = false*/) {
            if (opts.targetBaseName === opts.originalFilename || realpath === newpath) {
              return PromiseA.resolve(filename/*opts.targetBaseName*/);
            }

            return resizeAndSaveImage(image, newpath, filename, isNewFormat);
          }).error(function(/*exists = true*/) {
            return PromiseA.resolve(filename/*opts.targetBaseName*/);
          });
        });
      });
    });
  }

  function resizeAndSaveImage(image, newpath, filename, isNewFormat) {
    console.log('resize, filename', filename);

    // resize goals:
    // if width is given, auto adjust for height
    // if height is given, auto adjust for width
    // if w and h are given, choose the smallest best fit
    // if crop and w and h are given, choose the ratio fit (may add letterboxing)
    // always resize before crop?
    return image.sizeAsync().then(function (size) {
      var newsize
        ;

      //result = image.crop(newW, newH, offsetW, offsetH);

      newsize = require('./best-fit').fit(size, width, height);

      if (newsize.w !== size.width || newsize.h !== size.height) {
        image.resize(newsize.w, newsize.h);
      }

      if (isNewFormat) {
        image.setFormat(targetFormat);
      }

      return image.writeAsync(newpath).then(function () {
        return PromiseA.resolve(filename);
      });
    });
  }

  return retrieveOriginal(url, origpath);
}

module.exports.process = process;
