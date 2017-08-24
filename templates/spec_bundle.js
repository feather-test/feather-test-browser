/* helpers */

function parseKeyvalString(str) {
    var delimiter = "&";
    var associativeOperator = "=";
    var result = {};
    var decodedStr = str ? decodeURIComponent(str) : null;

    if (decodedStr) {
        var keylessCount = 1;
        var keyvals = decodedStr.split(delimiter);

        keyvals.forEach(function (kv) {
            var keyval = kv.split(associativeOperator);

            if (keyval.length >= 2) {
                var key = keyval.shift();
                var val = keyval.join("=");

                if (key) {
                    result[key.trim()] = val.trim();
                }
            } else if (keyval[0]) {
                result["KEYLESS_VALUE_" + keylessCount] = keyval[0].trim();
                keylessCount += 1;
            }
        });
    }

    return result;
}

function unparseKeyvalString(keyvals) {
    var delimiter = "&";
    var associativeOperator = "=";
    var str = [];

    Object.keys(keyvals).forEach(function (k) {
        var v = keyvals[k];
        str.push(k + associativeOperator + v);
    });

    return str.join(delimiter);
}

function parseLocationSearch(locationSearch) {
    var search = (locationSearch || window.location.search);
    return parseKeyvalString(search.slice(1));
}

/* object extend */

var arrSlice = Array.prototype.slice;
var hasProp = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function each(collection, iteratee, thisArg) {
    if (collection) {
        if (typeof collection.length !== "undefined") {
            for (var i = 0, len = collection.length; i < len; i++) {
                if (iteratee.call(thisArg, collection[i], i, collection) === false) {
                    return;
                }
            }

        } else {
            for (var prop in collection) {
                if (hasProp.call(collection, prop)) {
                    if (iteratee.call(thisArg, collection[prop], prop, collection) === false) {
                        return;
                    }
                }
            }
        }
    }
}

/* mutates first argument ignores undefined values */
function clone(thing) {
    var ret;
    var type = toString.call(thing).split("' '").pop();

    /* return simple types that have length */
    if (!thing || type === "String]" || type === "Function]" || thing === thing.window) {
        return thing;
    }

    if (type === "Object]") {
        if (thing.nodeType) {
            throw new Error("DOM Nodes should not be cloned using this clone method");
        }

        ret = Object.create(thing);
        for (var key in thing) {
            if (hasProp.call(thing, key)) {
                if (thing !== thing[key]) { /* recursion prevention */
                    ret[key] = clone(thing[key]);
                }
            }
        }

    } else if (thing.length) {
        ret = [];
        for (var i = 0, len = thing.length; i < len; i++) {
            if (thing !== thing[i]) { /* recursion prevention */
                ret[i] = clone(thing[i]);
            }
        }

    } else {
        ret = thing;
    }

    return ret;
}

function extend() {
    var ret = arguments[0];

    each(arrSlice.call(arguments, 1), function(ext) {
        each(ext, function(val, key) {
            if (typeof val !== "undefined") {
                ret[key] = clone(val);
            }
        });
    }, this);

    return ret;
}

/* local storage helpers */

var Storage = {};
Storage.get = function (name) {
    try {
        return JSON.parse(window.localStorage.getItem(name));
    } catch (e) {
        return false;
    }
};

Storage.set = function (name, data) {
    var oldData = Storage.get(name);
    if (oldData) {
        data = extend({}, oldData, data);
    }

    window.localStorage.setItem(name, JSON.stringify(data));
};

Storage.delete = function (name) {
    window.localStorage.setItem(name, "");
};

/* run your specs */

require.cache.clear();

var FeatherTestSpecMap = {{specMap}};
var inNode = !!global.FeatherTestBrowserCurrentSpec;

function runNodeTests() {
    var spec = global.FeatherTestBrowserCurrentSpec;
    if (spec) {
        FeatherTestSpecMap[spec]();
        if (typeof global.FeatherTestBrowserCallback === 'function') {
            global.FeatherTestBrowserCallback();
        }

    } else {
        for (var map in FeatherTestSpecMap) {
            FeatherTestSpecMap[map]();
        }
    }
}

function runBrowserTests() {
    function printResultsFromStorage () {
        var data = Storage.get('data');
        var first = true;
        each(data, function (v, k) {
            v.results.splice(0, 0, k + ':'); /* add a colon to the end of the key string */
            var strs = v.results.join("\\n");
            if (!first) {
                strs = '\\n\\n' + strs
            }
            console.log(strs);

            var resultsContainer = document.getElementById('results');
            if (resultsContainer) {
                resultsContainer.innerHTML += strs;
            }

            first = false;
        });
    }
    function matchSpec(specName) {
        for (var key in FeatherTestSpecMap) {
            if (key.indexOf(specName) !== -1) {
                return key;
            }
        }
        return false;
    }

    function specAfter(specName) {
        var keys = Object.keys(FeatherTestSpecMap);
        var next;
        keys.forEach(function (k, i) {
            if (k === specName) {
                next = keys[i + 1];
            }
        });
        return next;
    }

    function getNextUrlValues(spec, next, continuous) {
        if (!spec && !next) {
            /* first run. deafult to running all specs continuously */
            var keys = Object.keys(FeatherTestSpecMap);
            spec = keys[0];
            next = keys[1];
            continuous = true;

            return unparseKeyvalString({
                spec: spec,
                next: next,
                continuous: continuous
            });
        } else if (!continuous) {
            /* don"t wanna continue. */
            return false;
        } else if (!next || !FeatherTestSpecMap[next]) {
            /* nothing left, bail */
            return false;
        } else if (next) {
            if (specAfter(next)) {
                return unparseKeyvalString({
                    spec: next,
                    next: specAfter(next),
                    continuous: continuous
                });
            }
            return unparseKeyvalString({
                spec: next,
                continuous: continuous
            });
        }
    }

    function getUrlForNextTest(spec, next, continuousRun) {
        var nextUrlValues = getNextUrlValues(spec, next, continuousRun);
        if (nextUrlValues) {
            var nextTestUrl = window.location.origin + window.location.pathname + "?";
            return nextTestUrl + nextUrlValues;
        }
        return false;
    }

    function runSpec(specName) {
        if (specName) {
            var realSpecName = matchSpec(specName);
            if (realSpecName) {
                FeatherTestSpecMap[realSpecName]();
            } else {
                console.log("Cannot find the spec: " + spec);
            }
        }
    }

    var options = parseLocationSearch();
    var continuousRun = options.continuous;
    var spec = matchSpec(options.spec);
    var next = matchSpec(options.next);
    var state = options.state;

    var oldReporter = FeatherTest.reporter.report;

    FeatherTest.reporter.report = function (results) {
        var oldLog = console.log;
        var output = {};
        console.log = function (msg) {
            if (spec) {
                output[spec] = output[spec] || {};
                output[spec].results = output[spec].results || [];
                if (msg) {
                    output[spec].results.push(msg);
                }
                Storage.set('data', output);
            }
        };
        oldReporter(results);
        console.log = oldLog;
        FeatherTest.reporter.report = oldReporter;
    };

    if (state === 'finished') {
        document.body.style.background = '#eee';
        document.body.innerHTML = '<div id="button" style="' +
            'background-color: #794e79;' +
            'width: 50%;' +
            'max-width: 230px;' +
            'border-radius: 6px;' +
            'padding: 20px 40px;' +
            'margin: 40px auto 30px auto;' +
            'box-shadow: 1px 2px 3px rgba(0,0,0,0.5);' +
            'font-size: 24px;' +
            'color: white;' +
            'text-align: center;' +
            'font-family: sans-serif;' +
            'cursor: pointer;' +
        '">Run tests again</div>' +
        '<img src="{{gif}}" style="' +
            'width:100%;' +
            'max-width: 800px;' +
            'display: block;' +
            'margin: auto;' +
        '"/>' +
        '<pre id="results" style="' +
            'width: 100%;' +
            'max-width: 800px;' +
            'margin: 30px auto;' +
        '"></pre>';

        var button = document.getElementById('button');
        button.onclick = function () { window.location.href = window.location.origin + window.location.pathname; };

        FeatherTest.report(printResultsFromStorage);

        /* short circuit return statement.
         * dont run any tests.
         * dont redirect the page anywhere.
         * this is a really important line */
        return;

    } else if (!spec && !next || !continuousRun) {
        Storage.delete('data');
    }

    runSpec(spec);

    FeatherTest.report(printResultsFromStorage);

    var nextUrl = getUrlForNextTest(spec, next, continuousRun);
    if (nextUrl) {
        window.location.href = nextUrl;
    } else {
        window.location.href = window.location.origin + window.location.pathname + '?state=finished';
    }
}

if (inNode) {
    runNodeTests();

} else {
    runBrowserTests();
}


/* cleanup environment */
__dirname = "/";
