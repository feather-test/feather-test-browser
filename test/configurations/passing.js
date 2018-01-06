const babelProcessor = require('bundl-pack-babel');
const FeatherTestBrowser = require('../../index.js');

var testSuite = new FeatherTestBrowser({
    exitProcessWhenFailing: false,
    dirnameAvailable: true,
    helpers: [
        '../helpers/helper1.js',
        '../helpers/helper2.js'
    ],
    customMatchers: [
        {
            name: 'myCustomMatcher',
            message: 'to be custom',
            matcher: function (expected, actual) {
                return actual * 3 === expected;
            }
        }
    ],
    bundlPack: {
        js: babelProcessor({
            presets: ['env'],
        })
    },
});

testSuite.queue('../specs/features');
testSuite.helpers('../helpers/globbed');

module.exports = function (callback) {
    testSuite.run(callback);
};
