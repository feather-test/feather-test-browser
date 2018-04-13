const intercept = require('../intercept.js');

function createMockSendBeacon (origSendBeacon, hostOverride) {
    function mockSendBeacon (url, data) {
        let mockedUrl = intercept(url, hostOverride, mockSendBeacon) || '';
        return origSendBeacon.call(this, mockedUrl, data);
    };

    mockSendBeacon.calls = [];

    return mockSendBeacon;
}

module.exports = createMockSendBeacon;
