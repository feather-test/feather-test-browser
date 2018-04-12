const contains = require('../utils/contains');
const deepEqual = require('deep-equal');
const each = require('seebigs-each');

function matches (mock, request) {
    let doesMatch = true;

    each(mock.exact, function (value, predicate) {
        if (typeof value === 'object') {
            each(value, function (v, k) {
                if (!request[predicate] || !deepEqual(request[predicate][k], v, { strict: true })) {
                    doesMatch = false;
                    return false; // drop out of loop
                }
            });
        } else {
            if (request[predicate] !== value) {
                doesMatch = false;
                return false; // drop out of loop
            }
        }
    });

    each(mock.contains, function (value, predicate) {
        if (typeof value === 'object') {
            each(value, function (v, k) {
                if (!request[predicate] || !contains(request[predicate][k], v)) {
                    doesMatch = false;
                    return false; // drop out of loop
                }
            });
        } else {
            if (request[predicate].indexOf(value) === -1) {
                doesMatch = false;
                return false; // drop out of loop
            }
        }
    });

    return doesMatch;
}

module.exports = matches;
