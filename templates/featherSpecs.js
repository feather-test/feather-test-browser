/**
 * Run your specs
 */

var runInNode = require('{{pathToFeatherTestBrowser}}/lib/runInNode.js');
var runInBrowser = require('{{pathToFeatherTestBrowser}}/lib/runInBrowser.js');
var passingImageSrc = '{{pathToFeatherTestBrowser}}{{passingImage}}';

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
