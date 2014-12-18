'use strict';

var process = require('./process-image').process
  , path = require('path')
  ;

process(
  { imagesFolder: path.resolve(__dirname, 'images') }
, 'http://dropsha.re/files/ncbez.8/ajthedj-ajoneal.jpg'
, { width: null
  , height: null
  //, crop: crop
  , originalFilename: 'testname'
  , targetBaseName: 'testname' + 'png'
  , targetFormat: 'png'
  }
).then(function (filename) {
  console.log('filename', filename);
});
