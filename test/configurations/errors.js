const FeatherTestBrowser = require('../../index.js');

var testSuite = new FeatherTestBrowser({
    exitProcessWhenFailing: false,
    specs: '../specs/errors'
});

module.exports = function (callback) {
    testSuite.run(callback);
};
