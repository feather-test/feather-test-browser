const babelProcessor = require('bundl-pack-babel');
const FeatherTestBrowser = require('../../index.js');
const FeatherNetServer = require('../../feathernet/server');
const utils = require('seebigs-utils');
const args = utils.args();

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

testSuite.queue('../specs/feathernet');
testSuite.helpers('../helpers/globbed');

module.exports = function (callback) {
    const featherNet = new FeatherNetServer();
    featherNet.start();
    testSuite.run(function () {
        if (typeof callback === 'function') {
            callback();
        }
        if (args.ci) {
            featherNet.stop();
        }
    });
};
