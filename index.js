const bundlPack = require('bundl-pack');
const clone = require('./lib/clone.js');
const discoverSourcePath = require('discover-source-path');
const fs = require('fs');
const nodeAsBrowser = require('node-as-browser');
const opn = require('./lib/opn.js');
const path = require('path');
const tostring = require('./lib/tostring.js');
const utils = require('seebigs-utils');

const pathToFeatherTest = dropFileName(require.resolve('feather-test'));
const pathToFeatherRunner = pathToFeatherTest + '/bundle_ready/runner.js';

function dropFileName (path) {
    let pathParts = path.split('/');
    pathParts.pop();
    return pathParts.join('/');
}

function clearRequireCache () {
    for (var x in require.cache) {
        delete require.cache[x];
    }
}

function createBundleThenRun (relativeTo, options, done) {
    var concat = '';
    var latestDirname = '';

    function writeRequireIntoBundle (pathToFile) {
        if (options.dirnameAvailable) {
            var dirname = pathToFile.split('/');
            dirname.pop();
            dirname = dirname.join('/');
            if (dirname !== latestDirname) {
                concat += '__dirname = "' + dirname + '";\n';
                latestDirname = dirname;
            }
        }
        concat += 'require.cache.clear();\n';
        concat += 'require("' + pathToFile + '");\n';
    }

    function requireFile (specFile) {
        var pathToFile = path.resolve(relativeTo, specFile);
        var stats = fs.statSync(pathToFile);
        if (stats.isFile()) {
            writeRequireIntoBundle(pathToFile);
        } else {
            var files = utils.listFiles(pathToFile);
            files.forEach(function (file) {
                writeRequireIntoBundle(path.resolve(relativeTo, file));
            });
        }
    }

    var bundledOptions = clone(options);
    delete bundledOptions.destDir; // hide full paths from the pubilc bundle

    concat += '// setup feather-test-runner\n';
    concat += 'var featherTestOptions = ' + tostring.fromObject(bundledOptions) + '\n';
    concat += 'var FeatherTestRunner = require("' + pathToFeatherRunner + '");\n';
    concat += 'var featherTest = new FeatherTestRunner(featherTestOptions);\n';
    concat += 'featherTest.listen();\n'

    concat += '\n// load your helpers\n';
    utils.each(options.helpers, requireFile);

    concat += '\n// run your specs\n';
    utils.each(options.specs, requireFile);

    concat += '\n// cleanup environment\n'
    concat += '__dirname = "/";\n';

    concat += '\n// report results\n';
    concat += 'featherTest.report(global.FeatherTestBrowserCallback);';

    var testBundleOptions = {
        leadingComments: false,
        obscure: true
    };
    var testBundle = bundlPack(testBundleOptions).one.call({ LINES: concat.split('\n').length + 3 }, concat, {
        name: 'test.js',
        contents: concat,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/test.js', testBundle.contents, function () {
        utils.writeFile(options.destDir + '/test.html', utils.readFile(__dirname + '/lib/test.html'), function (written) {
            done({
                html: options.destDir + '/test.html',
                js: options.destDir + '/test.js'
            });
        });
    });
}


function FeatherTest (config) {
    config = config || {};

    if (typeof config !== 'object') {
        config = {
            specs: config
        }
    }

    config.specs = config.specs || [];
    if (typeof config.specs === 'string') {
        config.specs = [config.specs];
    }

    var defaultConfig = {
        destDir: './feather',
        dirnameAvailable: true,
        helpers: [],
        stopAfterFistFailure: false,
        timeout: 5000
    };
    var extendedConfig = Object.assign({}, defaultConfig, config, utils.args());
    extendedConfig.destDir = path.resolve(extendedConfig.destDir);

    this.config = extendedConfig;

    this.helpers = function (helpers) {
        this.config.helpers = this.config.helpers.concat(helpers);
    }

    this.queue = function (specs) {
        this.config.specs = this.config.specs.concat(specs);
    };

    this.run = function (callback) {
        var options = this.config;
        var relativeTo = this._relativeTo || discoverSourcePath(3);

        createBundleThenRun(relativeTo, options, function (testBundle) {
            console.log('\nRun your test in any browser: ' + testBundle.html);

            if (!global.document) {
                nodeAsBrowser.init(global);
            }

            global.FeatherTestBrowserCallback = function () {
                clearRequireCache();
                if (typeof callback === 'function') {
                    callback();
                }
             };
            require(testBundle.js);

            if (options.open) {
                opn(testBundle.html);
            }
        });
    };
}

module.exports = FeatherTest;
