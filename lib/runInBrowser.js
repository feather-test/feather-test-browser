/**
 * Run specs in Browser
 */

var each = require('seebigs-each');
var storage = require('./storage.js');

var runningState = 'running';
var finishedState = 'finished';

/* helpers */

function currentBaseUrl() {
    return window.location.protocol + '//' + window.location.host + window.location.pathname;
}

function parseKeyvalString(str) {
    var delimiter = "&";
    var associativeOperator = "=";
    var result = {};
    var decodedStr = str ? decodeURIComponent(str) : null;

    if (decodedStr) {
        var keylessCount = 1;
        var keyvals = decodedStr.split(delimiter);

        each(keyvals, function (kv) {
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

function toQueryString(keyvals) {
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



function runInBrowser(FeatherTestSpecMap, passingImageSrc) {

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
        each(keys, function (k, i) {
            if (k === specName) {
                next = keys[i + 1];
            }
        });
        return next;
    }

    function getNextUrlValues(spec, next, running) {
        if (!spec && !next) {
            /* first run. deafult to running all specs continuously */
            var keys = Object.keys(FeatherTestSpecMap);
            spec = keys[0];
            next = keys[1];
            running = true;

            return toQueryString({
                spec: spec,
                next: next,
                state: runningState,
            });

        } else if (!running) {
            /* don"t wanna continue. */
            return false;

        } else if (!next || !FeatherTestSpecMap[next]) {
            /* nothing left, bail */
            return false;

        } else if (next) {
            if (specAfter(next)) {
                return toQueryString({
                    spec: next,
                    next: specAfter(next),
                    state: runningState,
                });
            }
            return toQueryString({
                spec: next,
                state: runningState,
            });
        }
    }

    function getUrlForNextTest(spec, next, running) {
        var nextUrlValues = getNextUrlValues(spec, next, running);
        if (nextUrlValues) {
            var nextTestUrl = currentBaseUrl() + "?";
            return nextTestUrl + nextUrlValues;
        }
        return false;
    }

    function invokeSpec(specName) {
        if (specName) {
            var realSpecName = matchSpec(specName);
            if (realSpecName) {
                console.log('Running ' + specName);
                FeatherTestSpecMap[realSpecName]();
            } else {
                console.error("Cannot find the spec: " + spec);
            }
        }
    }

    function overrideLogsAndReport(results) {
        var resultsOutput = '';

        var oldLog = console.log;
        console.log = function () {
            each(arguments, function (arg) {
                resultsOutput += '\n' + arg;
            });
            oldLog.apply(this, arguments);
        };

        var oldError = console.error;
        console.error = function () {
            each(arguments, function (arg) {
                resultsOutput += '\n' + arg;
            });
            oldError.apply(this, arguments);
        };

        FeatherTest.reporter.report(results);

        console.log = oldLog;
        console.error = oldError;

        return resultsOutput;
    }

    var options = parseLocationSearch();
    var running = options.state === runningState;
    var finished = options.state === finishedState;
    var spec = matchSpec(options.spec);
    var next = matchSpec(options.next);

    if (finished) {
        var specOutput = storage.get('featherOutput');
        if (specOutput) {
            console.info('Spec Output:\n', specOutput);
        }

        document.body.innerHTML = require('../templates/results.html');

        var runAgain = document.getElementById('again');
        runAgain.onclick = function () {
            window.location.href = currentBaseUrl();
        };

        var results = storage.get('featherResults');

        if (results) {
            var resultsOutput = overrideLogsAndReport(results);

            var resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = resultsOutput;

            if (results.passed.length && !results.failed.length) {
                resultsContainer.style.maxWidth = '600px';
                var passingImage = document.getElementById('passing');
                passingImage.src = passingImageSrc;
            }

        } else {

        }

    } else if (running) {
        var oldLog = console.log;
        console.log = function () {
            each(arguments, function (arg) {
                var currentOutput = storage.get('featherOutput') || '';
                storage.set('featherOutput', currentOutput + '\n' + arg);
            });
            oldLog.apply(this, arguments);
        };

        invokeSpec(spec);

        FeatherTest.reporter.report = function (results) {
            storage.mergeResults('featherResults', results);
            var nextUrl = getUrlForNextTest(spec, next, running);
            if (nextUrl) {
                window.location.href = nextUrl;
            } else {
                window.location.href = currentBaseUrl() + '?state=' + finishedState;
            }
        };

        FeatherTest.report();

    } else {
        // cleanup for a fresh run
        storage.clear('featherOutput');
        storage.clear('featherResults');

        if (spec) {
            invokeSpec(spec);
            FeatherTest.report();

        } else {
            window.location.href = currentBaseUrl() + '?state=' + runningState;
        }
    }
}

module.exports = runInBrowser;
