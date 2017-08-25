
function clear (key) {
    return window.localStorage.setItem(key, null);
}

function get (key) {
    try {
        return JSON.parse(window.localStorage.getItem(key));
    } catch (e) {
        return null;
    }
}

function set (key, value) {
    try {
        return window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // do nothing
    }
}

function mergeResults (key, results) {
    var storedResults = get(key) || { failed: [], passed: [], skipped: [] };
    if (storedResults) {
        storedResults.failed = storedResults.failed.concat(results.failed);
        storedResults.passed = storedResults.passed.concat(results.passed);
        storedResults.skipped = storedResults.skipped.concat(results.skipped);
    }
    return set(key, storedResults);
}

module.exports = {
    mergeResults: mergeResults,
    get: get,
    set: set,
    clear: clear,
};
