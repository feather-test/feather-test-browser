const intercept = require('../intercept.js');

function createMockFetch (origFetch, config) {
    function mockFetch (url, options) {
        let mockedUrl = intercept(url, config.hostOverride, mockFetch) || '';
        return origFetch.call(this, mockedUrl, options);
    };

    mockFetch.calls = [];

    return mockFetch;
}

module.exports = createMockFetch;
