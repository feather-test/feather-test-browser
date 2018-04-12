const intercept = require('../intercept.js');

function createMockAppendChild (origAppendChild, config) {
    function mockAppendChild (elem) {
        if (!elem) { return; }
        let targetElem = this;
        elem.src = intercept(elem.src, config.hostOverride, mockAppendChild);
        return origAppendChild.call(targetElem, elem);
    }

    mockAppendChild.calls = [];

    return mockAppendChild;
}



module.exports = createMockAppendChild;
