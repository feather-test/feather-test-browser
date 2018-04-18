const intercept = require('../intercept.js');

function createMockAppendChild (origAppendChild, hostOverride) {
    function mockAppendChild (elem) {
        if (!elem) { return; }
        let targetElem = this;
        elem.src = intercept(elem.src, hostOverride, mockAppendChild);
        return origAppendChild.call(targetElem, elem);
    }

    mockAppendChild.calls = [];

    return mockAppendChild;
}



module.exports = createMockAppendChild;
