Resize-as-a-Service
===================

When you've got a blog or a web application there are oft times that you
want to store a local copy of some remote image you're linking to 
(so that it doesn't disappear and leave you content-less)
and there are also times that you want to resize such an image so that
it downloads faster.

This does both.

Tada!

  * <http://resize.example.com/api/resize?width={{width}}&url={{url}}>
  * <http://resize.example.com/api/resize?height={{height}}&url={{url}}>
  * <http://resize.example.com/api/resize?height={{height}}&width={{width}}&url={{url}}>
  * <http://resize.example.com/api/resize?url={{url}}&format={{png|jpg|gif}}&quality=85>

NOTE: the local cache of the image will include a direct download of the original image as well as the modified image.

NOTE: resize will only make images smaller, not larger.

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
# Ubunut
sudo apt-get install graphicsmagick imagemagick

# OS X
brew install graphicsmagick imagemagick
```

```bash
git clone git@github.com:coolaj86/resize-as-a-service.git
pushd resize-as-a-service
vim config.js # change host and port to your host and port

node ./runner 3000
```

If you generically want your pictures to have a width of 500px
then prefix all of your image URLs with the following:

```
http://images.example.com/api/resize?w=500&url=
```

If I were linking to an image from imgur I would do so like this:

```
http://images.example.com/api/resize?w=500?url=http://i.imgur.com/b5S2Ga1.png
```

For best results you may wish to call `encodeURIComponent(picUrl)`
so that the server isn't confused by excess `?` and `&`.

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
  * Checks `./images` for the file by that hash + extension
    * If the file doesn't exist, it downloads it
  * Then it issues a 302 redirect to google's image caching api, pointing to the locally saved file
  * Google requests the saved file, resizes it, and stores it in the cache
  * It's not known if google limits the number of requests, but if it does it will redirect back the file directly and the file will be served without resizing

All of that may change in the future.

Copyright and license
===

Code and documentation copyright 2014 AJ ONeal Tech, LLC.

Code released under the [Apache license](https://github.com/coolaj86/resize-as-a-service/blob/master/LICENSE).

Docs released under [Creative Commons](https://github.com/coolaj86/resize-as-a-service/blob/master/LICENSE.DOCS).
