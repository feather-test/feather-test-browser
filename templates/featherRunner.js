// setup globals
if (!window.global){
    window.global = window;
}
if (!global.__dirname) {
    global.__dirname = '/';
}

// setup feather-test-runner
var featherTestOptions = {{{options}}};

var FeatherTestRunner = require("{{pathToFeatherRunner}}");
global.FeatherTest = new FeatherTestRunner(featherTestOptions);

// load your plugins
{{{plugins}}}

// load your helpers
{{{helpers}}}

FeatherTest.listen();
