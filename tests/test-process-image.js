'use strict';

var process = require('../process-image').process
  , path = require('path')
  ;

process(
  { imagesFolder: path.resolve(__dirname, 'images/resized')
  , originalsFolder: path.resolve(__dirname, 'images/originals')
  , apiRoute: '/api'
  }
, 'http://dropsha.re/files/ncbez.8/ajthedj-ajoneal.jpg'
, { width: null
  , height: null
  //, crop: crop
  , originalFilename: 'testname'
  , targetBaseName: 'testname' + 'png'
  , targetFormat: 'png'
  }
).then(function (data) {
  console.log('filename', data.filename);
});
