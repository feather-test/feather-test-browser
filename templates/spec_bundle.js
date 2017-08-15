/* run your specs */
require.cache.clear();

var FeatherTestSpecMap = {{specMap}};

var FeatherTestSpecToRun = global.FeatherTestBrowserCurrentSpec || window.location.hash.substr(1);
if (FeatherTestSpecToRun) {
    FeatherTestSpecMap[FeatherTestSpecToRun]();
} else {
    for (var map in FeatherTestSpecMap) { FeatherTestSpecMap[map](); }
}

/* cleanup environment */
__dirname = '/';

/* report results */
if (typeof global.FeatherTestBrowserCallback === "function") {
    FeatherTest.report(global.FeatherTestBrowserCallback);
} else {
    FeatherTest.report(function(){ console.log("spec done"); });
}
