'use strict';

var fit = require('../best-fit').fit
  ;

function bestMinFit(size, width, height) {
  var newReal = fit(size, width, height)
    ;

  console.log(size.width + 'x' + size.height);
  console.log(' => ' + (width||'___') + 'x' + (height||'___'));
  console.log(' => ' + Math.round(newReal.w) + ':' + Math.round(newReal.h));
  console.log();
}

console.log();
console.log('=============');
console.log('=== best fit');
console.log();
bestMinFit({ width: 900, height: 500 }, 800, 600);
bestMinFit({ width: 700, height: 700 }, 800, 600);
bestMinFit({ width: 500, height: 900 }, 800, 600);

console.log();
console.log('================');
console.log('=== height only');
console.log();
bestMinFit({ width: 900, height: 500 }, null, 600);
bestMinFit({ width: 700, height: 700 }, null, 600);
bestMinFit({ width: 500, height: 900 }, null, 600);

console.log();
console.log('===============');
console.log('=== width only');
console.log();
bestMinFit({ width: 900, height: 500 }, 800, null);
bestMinFit({ width: 700, height: 700 }, 800, null);
bestMinFit({ width: 500, height: 900 }, 800, null);
