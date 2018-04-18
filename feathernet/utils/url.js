const each = require('seebigs-each');

function parseUrlString (str) {
    var tmp = str.split('//');
    var protocol = tmp.shift();
    tmp = tmp.join('//');
    tmp = tmp.split('#');

    var hash = '';
    var tail = '';
    if (tmp.length > 1) {
        tail = tmp.shift();
        hash = '#' + tmp.join('#');
    } else {
        tail = tmp[0];
    }

    tmp = tail.split('?');
    var head = tmp.shift();
    head = head.split('/');
    var search = tmp.join('?') || '';
    var host = head.shift();
    var pathname = '/' + head.join('/');
    tmp = host.split(':');
    var hostname = tmp[0];
    var port = tmp[1] || '';

    return {
        protocol: protocol,
        host: host,
        hostname: hostname,
        port: port,
        pathname: pathname,
        hostpath: host + pathname,
        hash: hash,
        search: search
    };
}

function URL (initString, initParams) {

    function setParamsFromString (str) {
        var params = {};

        if (typeof str === 'string' && str.length > 1) {
            each(decodeURIComponent(str.substr(1)).split('&'), function (pair) {
                var split = pair.split('=');
                params[split[0]] = split[1];
            });
        }

        this.params = params;
    }

    function setUrlFromString (str) {
        var parsed = parseUrlString(str);

        this.protocol = parsed.protocol;
        this.host = parsed.host;
        this.hostname = parsed.hostname;
        this.port = parsed.port;
        this.pathname = parsed.pathname;
        this.hostpath = parsed.hostpath;
        this.hash = parsed.hash;

        if (initParams) {
            this.params = initParams;
        } else {
            setParamsFromString.call(this, '?' + parsed.search);
        }
    }

    Object.defineProperty(this, 'search', {
        get: function () {
            var params = [];

            each(this.params, function (val, key) {
                params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
            });

            return params.length ? '?' + params.join('&') : '';
        },
        set: setParamsFromString,
        enumerable: true,
    });

    Object.defineProperty(this, 'href', {
        get: function () {
            return this.protocol + '//' + this.host + this.pathname + this.search + this.hash;
        },
        set: setUrlFromString,
        enumerable: true,
    });

    setUrlFromString.call(this, initString || '');
}

module.exports = URL;
