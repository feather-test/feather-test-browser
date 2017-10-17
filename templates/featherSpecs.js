/**
 * Run your specs
 */

var runInBrowser = require('{{pathToFeatherTestBrowser}}/lib/runInBrowser.js');
var passingImageSrc = '{{pathToFeatherTestBrowser}}{{passingImage}}';

require.cache.clear();

var FeatherTestSpecMap = {{{specMap}}};

runInBrowser(FeatherTestSpecMap, passingImageSrc);

/* cleanup environment */
__dirname = "/";
