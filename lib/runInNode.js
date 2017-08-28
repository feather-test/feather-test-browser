/**
 * Run specs in NodeJS
 */

function runInNode(FeatherTestSpecMap) {
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

module.exports = runInNode;
