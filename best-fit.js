'use strict';

// make the picture fit within the bounds as large as possible
//
// EXAMPLES
//
// Original 1: 900x500
// Original 2: 700x700
// Original 3: 500x900
//
// Aspect: 800x600
//  N1: 800x?
//  N2:   ?x600
//
// Aspect: 800x?
//  N1: 800x?
//  N2: 700x?
//
// Aspect:   ?x600
//  N1: ?x500
//  N2: ?x600
function bestMinFit(size, width, height) {
  var newReal
    , rw
    , rh
    ;

  rw = Math.min(1, (width || size.width) / size.width);
  rh = Math.min(1, (height || size.height) / size.height);

  if (rw < rh) {
    console.log(rw);
    newReal = { w: size.width * rw, h: size.height * rw };
  } else if (rh < rw) {
    console.log(rh);
    newReal = { w: size.width * rh, h: size.height * rh };
  } else {
    console.log(1);
    newReal = { w: size.width, h: size.height };
  }

  return newReal;
}

/*
function bestMinFit2(size, width, height) {
  var new1 = { w: 0, h: 0}
    , new2 = { w: 0, h: 0}
    , ratio = size.width / size.height
    , newReal
    ;

  if (width && (width < size.width)) {
    new1.w = width;
    new1.h = width * (1/ratio);
  } else {
    new1.w = size.width;
    new1.h = size.height;
  }

  if (height && (height < size.height)) {
    new2.w = height * (ratio);
    new2.h = height;
  } else {
    new2.w = size.width;
    new2.h = size.height;
  }

  if (new1.w < new2.w || new1.h < new2.h) {
    newReal = new1;
  } else {
    newReal = new2;
  }
}
*/

module.exports.fit = bestMinFit;
