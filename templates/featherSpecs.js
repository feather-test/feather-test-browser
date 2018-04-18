/**
 * Run your specs
 */

var runInBrowser = require('{{pathToFeatherTestBrowser}}/lib/runInBrowser.js');

require.cache.clear();

var FeatherTestSpecMap = {{{specMap}}};

runInBrowser(FeatherTestSpecMap);

/* cleanup environment */
__dirname = "/";
