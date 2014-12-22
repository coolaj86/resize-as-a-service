Resize-as-a-Service
===================

When you've got a blog or a web application there are oft times that you
want to store a local copy of some remote image you're linking to 
(so that it doesn't disappear and leave you content-less)
and there are also times that you want to resize such an image so that
it downloads faster.

This does both.

Tada!

  * /resize/api?width={{width}}&url={{url}}
  * /resize/api?height={{height}}&url={{url}}
  * /resize/api?height={{height}}&width={{width}}&url={{url}}
  * /resize/api?format={{png|jpg|gif}}&quality=85&url={{url}}

NOTE: the local cache of the image will include a direct download of the original image as well as the modified image.

NOTE: resize will only make images smaller, not larger.

For best results you may wish to call `encodeURIComponent(picUrl)`
so that the server isn't confused by excess `?` and `&`.

Example
=======

See <https://github.com/coolaj86/resize-as-a-service-example> for a 60-second tutorial.

All Parameters
--------------

  * &height=100 - bound the height to 100px and adjust the width proportionally
  * &width=150 - bound the width to 150px and adjust the height proportionally
  * &url=`encodeURIComponent('http://example.com/image.png')` - the image to cache / resize
    * NOTE: all URLs SHOULD be URI encoded, but URLs with `?` and `&` MUST be encoded.
  * &format=jpg|png|gif - convert to this format
  * &quality=85 - quality (jpg/gif) or compression (png) level
  * &refresh=86400 - the image will be checked for updates when it is accessed at least one day (86400 seconds) later
    * NOTE: if there is an error retrieving the new image, the cached copy will be used
  * &state=123 - never expire the cache for this image and save it as state 123

### state

Once an image is cached the source image will not be checked for updates
(unless refresh is specified).

If you know that image has changed since it was cached and you want to use
the newer image, specify a state parameter. If that state doesn't exist
the image will be redownloaded and the result will be cached as that state.

Install & Usage
===============

```bash
# Ubuntu
sudo apt-get install graphicsmagick imagemagick

# OS X
brew install graphicsmagick imagemagick
```


Example with Connect / Express

```javascript
'use strict';

var http = require('http')
  , serve = require('../server')
  , port
  , server
  , connect = require('connect') // or express
  , path = require('path')
  , resizer = require('resize-as-a-service')
  , app = connect()
  , conf
  ;

port = port || process.argv[2] || 3000;

conf = {
  imagesFolder: path.resolve(__dirname, 'images', 'resized')
, originalsFolder: path.resolve(__dirname, 'images', 'originals')
, apiRoute: '/api'
};

app
  .use('/resize', resizer.create(conf))
  .use(function (req, res) {
    res.end('You probably thought this was a path to a real image... Nope. Chuck Testa!');
  })
  ;

server = http.createServer(serve.create());
server.listen(port, function() {
  console.log('Listening on port ' + port);
});
```


* <https://github.com/coolaj86/resize-as-a-service-example/blob/master/bin/serve.js>
* <https://github.com/coolaj86/resize-as-a-service-example/blob/master/server.js>


Configuration
=============

```javascript
{ apiRoute: '/api'
, mountedAt: null // i.e. /resize
, imageRoute: '/assets'
, imageFolder: path.join(__dirname, '/images')
}
```

How it works
===

  * Turns `url` into an md5 hash.
  * Checks `originalsFolder` for the file metadata by that hash and hash + extension
    * If the file doesn't exist, it downloads it and extracts metadata
  * Then it turns the query parameters into a hash and checks for the metadata file
    * If the file doesn't exist, it resizes the image
    * Otherwise it passes the path to the static file server

Some of the internals may change in the future.

Copyright and license
===

Code and documentation copyright 2014 AJ ONeal Tech, LLC.

Code released under the [Apache license](https://github.com/coolaj86/resize-as-a-service/blob/master/LICENSE).

Docs released under [Creative Commons](https://github.com/coolaj86/resize-as-a-service/blob/master/LICENSE.DOCS).
