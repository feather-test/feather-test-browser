const each = require('seebigs-each');

function contains (obj, value) {
    if (typeof obj.indexOf === 'function') {
        return obj.indexOf(value) !== -1;
    } else if (typeof value === 'object') {
        let hasAll = true;
        each(value, function (v, k) {
            if (obj[k] !== v) {
                hasAll = false;
            }
        });
        return hasAll;
    }
}

module.exports = contains;
