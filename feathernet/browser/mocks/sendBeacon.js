const intercept = require('../intercept.js');

function createMockSendBeacon (origSendBeacon, config) {
    function mockSendBeacon (url, data) {
        let mockedUrl = intercept(url, config.hostOverride, mockSendBeacon) || '';
        return origSendBeacon.call(this, mockedUrl, data);
    };

    mockSendBeacon.calls = [];

    return mockSendBeacon;
}

module.exports = createMockSendBeacon;
