const bundlPack = require('bundl-pack');
const clone = require('./lib/clone.js');
const discoverSourcePath = require('discover-source-path');
const fs = require('fs');
const nodeAsBrowser = require('node-as-browser');
const opn = require('./lib/opn.js');
const path = require('path');
const template = require('./lib/template.js');
const tostring = require('./lib/tostring.js');
const utils = require('seebigs-utils');

const pathToFeatherTest = dropFileName(require.resolve('feather-test'));
const pathToFeatherRunner = pathToFeatherTest + '/bundle_ready/runner.js';

var bundlPackOptions = {
    leadingComments: false,
    obscure: true,
};

function clearRequireCache () {
    for (var x in require.cache) {
        delete require.cache[x];
    }
}

function createFeatherRunnerBundle (options, done) {
    var concat = '';

    function writeRequire (pathToFile) {
        if (options.dirnameAvailable) {
            var dirname = pathToFile.split('/');
            dirname.pop();
            dirname = dirname.join('/');
            concat += '__dirname = "' + dirname + '";\n';
        }
        concat += 'require.cache.clear();\n';
        concat += 'require("' + pathToFile + '");\n';
    }

    function writeAddPlugin (pathToPlugin, pluginName) {
        concat += 'FeatherTest.addPlugin("' + pluginName + '", require("' + pathToPlugin + '"));\n'
    }

    var bundledOptions = clone(options);

    // hide full paths from the pubilc bundle
    delete bundledOptions.destDir;
    delete bundledOptions.plugins;

    concat += '// setup globals\n';
    concat += 'if (!window.global){ window.global = window; }\n';

    concat += '// setup feather-test-runner\n';
    concat += 'var featherTestOptions = ' + tostring.fromObject(bundledOptions) + '\n';
    concat += 'var FeatherTestRunner = require("' + pathToFeatherRunner + '");\n';
    concat += 'global.FeatherTest = new FeatherTestRunner(featherTestOptions);\n';
    concat += 'FeatherTest.listen();\n'

    concat += '\n// load your plugins\n';
    utils.each(options.plugins, writeAddPlugin);

    concat += '\n// load your helpers\n';
    utils.each(options.helpers, writeRequire);

    var testBundle = bundlPack(bundlPackOptions).one.call({ LINES: concat.split('\n').length + 3 }, concat, {
        name: 'featherRunner.js',
        contents: concat,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherRunner.js', testBundle.contents, done);
}

function createFeatherReporterBundle (options, done) {
    var concat = '';

    concat += '\n// cleanup environment\n'
    concat += '__dirname = "/";\n';

    concat += '\n// report results\n';
    concat += 'global.FeatherTest.report(global.FeatherTestBrowserCallback);';

    utils.writeFile(options.destDir + '/featherReporter.js', concat, done);
}

function createFeatherSpecBundle (options, done) {
    var concat = '';

    concat += '\n// run your specs\n';
    // need __dirname
    concat += 'require.cache.clear();\n';
    concat += 'require(global.FeatherTestBrowserCurrentSpec);\n';

    var testBundle = bundlPack(bundlPackOptions).one.call({ LINES: concat.split('\n').length + 3 }, concat, {
        name: 'featherSpecs.js',
        contents: concat,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherSpecs.js', testBundle.contents, done);
}

function createSpecBundle (specFile, specName, options, done) {
    var concat = '';

    concat += '\n// load your specs\n';
    if (options.dirnameAvailable) {
        var dirname = specFile.split('/');
        dirname.pop();
        dirname = dirname.join('/');
        concat += '__dirname = "' + dirname + '";\n';
    }
    concat += 'require.cache.clear();\n';
    concat += 'require("' + specFile + '");\n';

    var testBundle = bundlPack(bundlPackOptions).one.call({ LINES: concat.split('\n').length + 3 }, concat, {
        name: specName + '.js',
        contents: concat,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/' + specName + '.js', testBundle.contents, done);
}

function dropFileName (path) {
    let pathParts = path.split('/');
    pathParts.pop();
    return pathParts.join('/');
}

function resolvePaths (arrayOfPaths, relativeTo) {
    var resolved = [];

    utils.each(arrayOfPaths, function (pathInput) {
        var pathToFile = path.resolve(relativeTo, pathInput);
        var stats = fs.statSync(pathToFile);
        if (stats.isFile()) {
            resolved.push(pathToFile);
        } else {
            var files = utils.listFiles(pathToFile);
            files.forEach(function (file) {
                resolved.push(path.resolve(relativeTo, file));
            });
        }
    });

    return resolved;
}

function runSpecsUntilDone (specs, callback, currentSpecNum) {
    nodeAsBrowser.init(options.nodeAsBrowser);
    global.FeatherTestBrowserCurrentSpec = options.specs[currentSpecNum];
    if (currentSpecNum < specs.length - 1) {
        global.FeatherTestBrowserCallback = function () {
            runSpecsUntilDone(specs, callback, currentSpecNum + 1);
        };
    }
    require(options.destDir + '/featherSpecs.js');
}


function FeatherTestBrowser (config) {
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
        exitProcessWhenFailing: true,
        helpers: [],
        nodeAsBrowser: {},
        stopAfterFistFailure: false,
        timeout: 5000,
    };
    var extendedConfig = Object.assign({}, defaultConfig, config, utils.args());
    extendedConfig.destDir = path.resolve(extendedConfig.destDir);
    extendedConfig.plugins = extendedConfig.plugins || {};
    Object.assign(extendedConfig.plugins, {
        external: __dirname + '/./lib/external.js',
    });
    Object.assign(bundlPackOptions, extendedConfig.bundlPack);

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

        // flatten file paths
        options.specs = resolvePaths(options.specs, relativeTo);
        options.helpers = resolvePaths(options.helpers, relativeTo);
        options.plugins = resolvePaths(options.plugins, relativeTo);

        utils.cleanDir(options.destDir);

        createFeatherRunnerBundle(options, function () {
            createFeatherReporterBundle(options, function () {
                createFeatherSpecBundle(options, function () {
                    utils.writeFile(options.destDir + '/test.html', utils.readFile(__dirname + '/lib/test3.html'), function () {
                        console.log('\nRun your test in any browser: ' + options.destDir + '/test.html');

                        require(options.destDir + '/featherRunner.js');

                        runSpecsUntilDone(options.specs, callback, 0);

                        // clearRequireCache();
                        // if (typeof callback === 'function') {
                        //     callback();
                        // }
                        //
                        // require(options.destDir + '/featherReporter.js');
                        //
                        // if (options.open) {
                        //     opn(options.destDir + '/test.html');
                        // }
                    });
                });
            });
        });
    };
}

module.exports = FeatherTestBrowser;
