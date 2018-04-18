const Body = require('./body');
const Headers = require('./headers');
const Json = require('./json');
const URL = require('../utils/url');

function Request (serverReq) {
    serverReq = serverReq || {};

    this.method = serverReq.method || 'GET';
    this.headers = new Headers(serverReq.headers);
    this.body = serverReq.body;

    this.url = new URL(serverReq.url.substr(1));
    this.headers.host = this.url.host;

    Object.defineProperty(this, 'referrer', {
        get: function () {
            return new URL(this.headers['Referrer']);
        },
        enumerable: true,
    });

    Body.call(this, serverReq.body);
    Json.call(this);
}

module.exports = Request;
