Resize-as-a-Service
===================

When you've got a blog or a web application there are oft times that you
want to store a local copy of some remote image you're linking to 
(so that it doesn't disappear and leave you content-less)
and there are also times that you want to resize such an image so that
it downloads faster.

This does both.

Tada!

  * <http://resize.example.com/api/resize?w={{width}}&url={{url}}>
  * <http://resize.example.com/api/resize?h={{height}}&url={{url}}>
  * <http://resize.example.com/api/resize?h={{height}}&w={{width}}&url={{url}}>
  * <http://resize.example.com/api/resize?url={{url}}&format={{png|jpg|gif}}&quality=85>

Note that the local copy of the image will a direct download of the original image,
but as of right now the resized version will be jpg, regardless of the original image type.

Other parameters

  * &refresh=86400 - the cache for this image will expire after one day (86400 seconds)
  * &state=123 - never expire the cache for this image and save it as state 123

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
