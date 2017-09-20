/**
 * Run specs in NodeJS
 */

function runInNode(FeatherTestSpecMap) {
    var specName = global.FeatherTestBrowserCurrentSpec;
    if (specName) {
        console.log('Running ' + specName);
        FeatherTestSpecMap[specName]();
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
