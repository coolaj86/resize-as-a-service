'use strict';

var PromiseA = require('bluebird').Promise
  ,  request = require('request')
  , requestA = PromiseA.promisify(request)
  ,     path = require('path')
  ,       fs = PromiseA.promisifyAll(require('fs'))
  ,       gm = require('gm')
  ;

function process(conf, url, opts) {
  var     linkpath = path.resolve(conf.originalsFolder, opts.originalFilename)
    ,       height = opts.height
    ,        width = opts.width
    , targetFormat = opts.targetFormat
    ,      quality = opts.quality
    ,       ostate = opts.state
    ,     orefresh = opts.refresh // retrieve again from source after n seconds
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

  function dbGet(key) {
    return fs.readFileAsync(key, 'utf8').then(function (str) {
      return JSON.parse(str);
    });
  }
  function dbSet(key, value) {
    return fs.writeFileAsync(key, JSON.stringify(value), 'utf8');
  }
  /*
  function setFile(key, meta, blob) {
  }
  function getFile(key, meta) {
  }
  */

  function saveOriginal(ourl) {
    return requestA(ourl, { encoding: null }).spread(function (resp, blob) {
      if (resp.statusCode >= 400) {
        return PromiseA.reject(resp.statusCode);
      }

      var image = gm(blob)
        ;

      image.formatAsync = PromiseA.promisify(image.format);
      image.sizeAsync = PromiseA.promisify(image.size);
      image.writeAsync = PromiseA.promisify(image.write);

      return image.formatAsync().then(function(sourceFormat) {
        var realpath
          , meta
          ;

        sourceFormat = sourceFormat
          .toLowerCase()
          .replace(/(jpe?g|jf?if)/i, 'jpg')
          ;

        meta = {
          retrievedAt: Date.now()
        , size: blob.length
        , format: sourceFormat
        , name: opts.originalFilename + '.' + sourceFormat
        , url: ourl
        , state: ostate // a state param defines the state of the image at original retrieval time is the desired state
        , refresh: orefresh
        };

        realpath = path.resolve(conf.originalsFolder, meta.name);

        return fs.writeFileAsync(realpath, blob).then(function () {
          return dbSet(linkpath, meta);
        }).then(function () {
          return { meta: meta, image: image };
        });
      });
    });
  }

  // TODO put linkpath into db
  function retrieveOriginal(ourl, nocache) {
    if (nocache) {
      return saveOriginal(ourl);
    }

    // fs.existsAsync is reverse because error fires when exists is true
    return fs.existsAsync(linkpath).then(function (/*exists = false*/) {
      return saveOriginal(ourl);
    }).error(function (exists) {
      if (exists.message !== 'true') {
        throw exists;
      }

      return dbGet(linkpath).then(function (meta) {
        var expirey = (orefresh || 24 * 60 * 60) * 1000
          , data
          ;

        data = { meta: meta, image: null };

        if (data.meta.state || (Date.now() - meta.retrievedAt) < expirey) {
          return data;
        }

        return saveOriginal(ourl).error(function () {
          // if the original can't be retrieved from web, try to get it from disk anyway
          return data;
        });
      }).catch(function () {
        return saveOriginal(ourl);
      });
    });
  }

  function retrieveResized(data) {
    //, realpath = path.resolve(conf.originalsFolder, opts.originalFilename + '.' + data.meta.format)
    //data.realpath = path.resolve(conf.imagesFolder, data.filename);

    data.filename = opts.targetBaseName + '.' + (targetFormat || data.meta.format);
    data.newpath = path.resolve(conf.imagesFolder, data.filename);

    return fs.existsAsync(data.newpath).then(function (/*exists = false*/) {
      return resizeAndSaveImage(data);
    }).error(function(/*exists = true*/) {
      return PromiseA.resolve(data);
    });
  }

  function resizeAndSaveImage(data) {
    var isNewFormat = targetFormat && (targetFormat !== data.meta.format)
      , image
      ;

    if (data.image) {
      image = data.image;
    } else {
      image = gm(path.resolve(conf.originalsFolder, opts.originalFilename + '.' + data.meta.format));
      image.formatAsync = PromiseA.promisify(image.format);
      image.sizeAsync = PromiseA.promisify(image.size);
      image.writeAsync = PromiseA.promisify(image.write);
    }

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

      if (quality) {
        image.quality(quality);
      }

      return image.writeAsync(data.newpath).then(function () {
        return PromiseA.resolve(data);
      });
    });
  }

  return retrieveOriginal(url).then(function (data) {
    var isNewFormat = targetFormat && (targetFormat !== data.meta.format)
      ;

    if (opts.targetBaseName === opts.originalFilename && !isNewFormat) {
      data.filename = opts.originalFilename + '.' + data.meta.format;
      data.realpath = path.resolve(conf.originalsFolder, data.filename);

      // if no transformation, pass
      return PromiseA.resolve(data);
    }

    // if transformation, transform
    return retrieveResized(data);
  });
}

module.exports.process = process;
