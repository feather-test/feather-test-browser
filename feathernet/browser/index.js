const createMockAppendChild = require('./mocks/appendChild');
const createMockFetch = require('./mocks/fetch');
const createMockSendBeacon = require('./mocks/sendBeacon');
const createMockXhr = require('./mocks/xhr');

const _window = typeof window === 'undefined' ? {} : window;
const _origWindowFetch = _window.fetch;
const _origWindowXhr = _window.XMLHttpRequest;
const _origWindowSendBeacon = _window.navigator && _window.navigator.sendBeacon;
const _origAppendChild = _window.Node.prototype.appendChild;

const _global = typeof global === 'undefined' ? {} : global;
const _origNodeFetch = _global.fetch;
const _origNodeXhr = _global.XMLHttpRequest;
const _origNodeSendBeacon = _global.navigator && _global.navigator.sendBeacon;

/* Exposed for debugging while in Chrome */
_window._origWindowFetch = _origWindowFetch;
_window._origWindowXhr = _origWindowXhr;
_window._origAppendChild = _origAppendChild;

function FeatherNetBrowser (config) {
    config = config || {};

    if (!config.hostOverride) {
        config.hostOverride = 'localhost:9876';
    };

    this.install = function () {
        _window.Node.prototype.appendChild = createMockAppendChild(_origAppendChild, config);
        if (window) {
            window.fetch = createMockFetch(_origWindowFetch, config);
            window.XMLHttpRequest = createMockXhr(_origWindowXhr, config);
            if (window.navigator) {
                window.navigator.sendBeacon = createMockSendBeacon(_origWindowSendBeacon, config);
            }
        }
        if (global) {
            global.fetch = createMockFetch(_origNodeFetch, config);
            global.XMLHttpRequest = createMockXhr(_origNodeXhr, config);
            if (global.navigator) {
                global.navigator.sendBeacon = createMockSendBeacon(_origNodeSendBeacon, config);
            }
        }
    };

    this.uninstall = function () {
        _window.Node.prototype.appendChild = _origAppendChild;
        if (window) {
            window.fetch = _origWindowFetch;
            window.XMLHttpRequest = _origWindowXhr;
            if (window.navigator) {
                window.navigator.sendBeacon = _origWindowSendBeacon;
            }
        }
        if (global) {
            global.fetch = _origNodeFetch;
            global.XMLHttpRequest = _origNodeXhr;
            if (global.navigator) {
                global.navigator.sendBeacon = _origNodeSendBeacon;
            }
        }
    };

    this.addMocks = function (mocks) {
        var options = {
            method: 'post',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(mocks),
        };
        (_origWindowFetch || _origNodeFetch)('http://localhost:9877/feathernet-addMocks', options);
    };

    this.clearMocks = function () {
        (_origWindowFetch || _origNodeFetch)('http://localhost:9877/feathernet-clearMocks', { method: 'post' });
    };

    this.clearMocks();
}

module.exports = FeatherNetBrowser;
