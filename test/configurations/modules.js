const FeatherTestBrowser = require('../../index.js');

var testSuite = new FeatherTestBrowser({
    exitProcessWhenFailing: false,
    specs: '../specs/modules'
});

module.exports = function (callback) {
    testSuite.run(callback);
};
