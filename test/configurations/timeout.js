const FeatherTestBrowser = require('../../index.js');

var testSuite = new FeatherTestBrowser({
    exitProcessWhenFailing: false,
    specs: '../specs/timeout',
    timeout: 100
});

module.exports = function (callback) {
    testSuite.run(callback);
};
