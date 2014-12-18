'use strict';

var path = require('path')
  ;

module.exports = {
  hostname: 'localhost'
, port: '3000'
, href: 'http://localhost:3000'
//, imagesFolder: __dirname + '/images/'
, imagesFolder: path.resolve(__dirname, 'images')
, imagesRoute: '/images'
, apiRoute: '/api'
};
