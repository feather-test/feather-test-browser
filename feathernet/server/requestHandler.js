const each = require('seebigs-each');
const matches = require('../utils/matches');
const Request = require('../models/request');
const URL = require('../utils/url');

/**
 * Match a request against existing mocks and create a plan for how to respond
 * @returns {Object} A response plan for how the server should handle the response
 */
function requestHandler (serverReq, featherServer) {
    let request = new Request(serverReq);
    let responsePlan = { status: 404, type: 'text/html' };

    let matchFound = false;
    each(featherServer.mocks, function (mock) {
        if (mock.request) {
            if (matches(mock.request, request)) {
                matchFound = true;
                mock.response = mock.response || '';

                responsePlan.status = mock.response.status || 200;
                responsePlan.type = mock.response.type || 'text/html';

                if (mock.response.headers) {
                    responsePlan.headers = mock.response.headers;
                }

                if (mock.response.file) {
                    responsePlan.file = mock.response.file;
                } else {
                    if (typeof mock.response === 'object') {
                        if (mock.response.body) {
                            responsePlan.body = mock.response.body;
                        }
                    } else {
                        responsePlan.body = mock.response;
                    }
                }
            }
        }
    });

    return responsePlan;
}

module.exports = requestHandler;
