/**
 * Run your specs
 */

var runInNode = require('./lib/runInNode.js');
var runInBrowser = require('./lib/runInBrowser.js');
var passingImageSrc = '{{passingImageSrc}}';

require.cache.clear();

var FeatherTestSpecMap = {{{specMap}}};

var inNode = global && global.process && global.process.title === 'node';
if (inNode) {
    runInNode(FeatherTestSpecMap);
} else {
    runInBrowser(FeatherTestSpecMap, passingImageSrc);
}

/* cleanup environment */
__dirname = "/";
