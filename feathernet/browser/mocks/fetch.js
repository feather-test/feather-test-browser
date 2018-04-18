const intercept = require('../intercept.js');

function createMockFetch (origFetch, hostOverride) {
    function mockFetch (url, options) {
        let mockedUrl = intercept(url, hostOverride, mockFetch) || '';
        return origFetch.call(this, mockedUrl, options);
    };

    mockFetch.calls = [];

    return mockFetch;
}

module.exports = createMockFetch;
