/* helpers */

function parseKeyvalString(str) {
    var delimiter = '&';
    var associativeOperator = '=';
    var result = {};
    var decodedStr = str ? decodeURIComponent(str) : null;

    if (decodedStr) {
        var keylessCount = 1;
        var keyvals = decodedStr.split(delimiter);

        keyvals.forEach(function (kv) {
            var keyval = kv.split(associativeOperator);

            if (keyval.length >= 2) {
                var key = keyval.shift();
                var val = keyval.join('=');

                if (key) {
                    result[key.trim()] = val.trim();
                }
            } else if (keyval[0]) {
                result['KEYLESS_VALUE_' + keylessCount] = keyval[0].trim();
                keylessCount += 1;
            }
        });
    }

    return result;
}

function unparseKeyvalString(keyvals) {
    var delimiter = '&';
    var associativeOperator = '=';
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

/* run your specs */

require.cache.clear();

var FeatherTestSpecMap = {{specMap}};
var inNode = !!global.FeatherTestBrowserCurrentSpec;

function runNodeTests() {
    for (var map in FeatherTestSpecMap) {
        FeatherTestSpecMap[map]();
    }
}

function runBrowserTests() {
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
            /* don't wanna continue. */
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
            var nextTestUrl = window.location.origin + window.location.pathname + '?';
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

    runSpec(spec);

    var nextUrl = getUrlForNextTest(spec, next, continuousRun);
    if (nextUrl) {
        window.location.href = nextUrl;
    }
}

if (inNode) {
    runNodeTests();
} else {
    runBrowserTests();
}


/* cleanup environment */
__dirname = '/';

/* report results */
if (typeof global.FeatherTestBrowserCallback === "function") {
    FeatherTest.report(global.FeatherTestBrowserCallback);
} else {
    FeatherTest.report(function () {
        console.log("spec done");
    });
}

