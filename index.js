const bundlPack = require('bundl-pack');
const clone = require('./lib/clone.js');
const discoverSourcePath = require('discover-source-path');
const fs = require('fs');
const nodeAsBrowser = require('node-as-browser');
const path = require('path');
const template = require('./lib/template.js');
const tostring = require('./lib/tostring.js');
const utils = require('seebigs-utils');

const featherReporter = require('../feather-test/bundle_ready/reporter.js'); // FIXME
const pathToFeatherTest = dropFileName(require.resolve('../feather-test')); // FIXME
const pathToFeatherRunner = pathToFeatherTest + '/bundle_ready/runner.js';
const pathToAssets = __dirname + '/assets';

let currentSpecNum = -1;
let numberOfAfterSpecCallbacksExecuted = 0;
let megaResults = { passed: [], failed: [], skipped: [] };

const bundlPackOptions = {
    leadingComments: false,
    obscure: true,
};

function clearRequireCache () {
    for (let x in require.cache) {
        delete require.cache[x];
    }
}

function createFeatherRunnerBundle (options, done) {
    let concat = '';

    function writeRequire (pathToFile) {
        if (options.dirnameAvailable) {
            let dirname = pathToFile.split('/');
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

    let bundledOptions = clone(options);

    // hide full paths from the pubilc bundle
    delete bundledOptions.destDir;
    delete bundledOptions.helpers;
    delete bundledOptions.plugins;
    delete bundledOptions.specs;

    concat += '// setup globals\n';
    concat += 'if (!window.global){ window.global = window; }\n';

    concat += '// setup feather-test-runner\n';
    concat += 'var featherTestOptions = ' + tostring.fromObject(bundledOptions) + '\n';
    concat += 'var FeatherTestRunner = require("' + pathToFeatherRunner + '");\n';
    concat += 'global.FeatherTest = new FeatherTestRunner(featherTestOptions);\n';
    concat += 'FeatherTest.listen();\n';

    concat += '\n// load your plugins\n';
    utils.each(options.plugins, writeAddPlugin);

    concat += '\n// load your helpers\n';
    utils.each(options.helpers, writeRequire);

    let testBundle = bundlPack(bundlPackOptions).one.call({ LINES: concat.split('\n').length + 3 }, concat, {
        name: 'featherRunner.js',
        contents: concat,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherRunner.js', testBundle.contents, done);
}

function createFeatherSpecBundle (options, relativeTo, done) {
    let specBundleContents = fs.readFileSync(__dirname + '/templates/spec_bundle.js', 'utf8');

    let specMap = '{';
    utils.each(options.specs, function (spec) {
        let dirname = '';
        if (options.dirnameAvailable) {
            dirname = spec.split('/');
            dirname.pop();
            dirname = dirname.join('/');
            dirname = '__dirname = "' + dirname + '"; ';
        }
        specMap += '   "' + getSpecName(spec, relativeTo) + '": function(){ ' + dirname + 'require("' + spec + '"); },\n';
    });
    specMap += '}';

    specBundleContents = template(specBundleContents, { specMap: specMap, gif: pathToAssets + '/finished.gif' });


    let testBundle = bundlPack(bundlPackOptions).one.call({ LINES: specBundleContents.split('\n').length + 3 }, specBundleContents, {
        name: 'featherSpecs.js',
        contents: specBundleContents,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherSpecs.js', testBundle.contents, done);
}

function dropFileName (path) {
    let pathParts = path.split('/');
    pathParts.pop();
    return pathParts.join('/');
}

function getSpecName (specPath, relativeTo) {
    let specName = '';

    if (typeof specPath === 'string') {
        specName = specPath.replace(relativeTo, '').substr(1); // shorten to relative path
        specName = specName.split('.'); // break into segments on dots
        specName.pop(); // drop file extension
        specName = specName.join('.'); // reassemble as a string
        specName = specName.replace(/\W/g, '_'); // replace all non-word chars with underscore
    }

    return specName;
}

function resolvePaths (arrayOfPaths, relativeTo) {
    let resolved = [];

    utils.each(arrayOfPaths, function (pathInput) {
        let pathToFile = path.resolve(relativeTo, pathInput);
        let stats = fs.statSync(pathToFile);
        if (stats.isFile()) {
            resolved.push(pathToFile);
        } else {
            let files = utils.listFiles(pathToFile);
            files.forEach(function (file) {
                resolved.push(path.resolve(relativeTo, file));
            });
        }
    });

    return resolved;
}

function runSpecsUntilDone (specs, options, relativeTo, callback) {
    currentSpecNum++;
    if (currentSpecNum < specs.length) {
        clearRequireCache();
        require(options.destDir + '/featherRunner.js');
        let oldReporter = FeatherTest.reporter.report;

        FeatherTest.reporter.report = function (results) {
            numberOfAfterSpecCallbacksExecuted += 1;

            megaResults.passed = megaResults.passed.concat(results.passed);
            megaResults.failed = megaResults.failed.concat(results.failed);
            megaResults.skipped = megaResults.skipped.concat(results.skipped);

            if (numberOfAfterSpecCallbacksExecuted === specs.length) {
                oldReporter(megaResults);
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                runSpecsUntilDone(specs, options, relativeTo, callback);
            }
        };

        nodeAsBrowser.init(options.nodeAsBrowser);
        global.FeatherTestBrowserCurrentSpec = getSpecName(options.specs[currentSpecNum], relativeTo);
        require(options.destDir + '/featherSpecs.js');
        FeatherTest.report();
    }
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

    let defaultConfig = {
        destDir: './feather',
        dirnameAvailable: true,
        exitProcessWhenFailing: true,
        helpers: [],
        nodeAsBrowser: {},
        stopAfterFistFailure: false,
        timeout: 5000,
    };
    let extendedConfig = Object.assign({}, defaultConfig, config, utils.args());
    extendedConfig.destDir = path.resolve(extendedConfig.destDir);
    extendedConfig.plugins = extendedConfig.plugins || {};
    Object.assign(extendedConfig.plugins, {
        external: __dirname + '/./lib/external.js',
    });
    Object.assign(bundlPackOptions, extendedConfig.bundlPack);

    extendedConfig.reporter = {
        output: function(msg){ console.log(msg); },
        report: function(){},
    };

    this.config = extendedConfig;

    this.helpers = function (helpers) {
        this.config.helpers = this.config.helpers.concat(helpers);
    }

    this.queue = function (specs) {
        this.config.specs = this.config.specs.concat(specs);
    };

    this.run = function (callback) {
        let options = this.config;
        let relativeTo = this._relativeTo || discoverSourcePath(3);

        // flatten file paths
        options.specs = resolvePaths(options.specs, relativeTo).filter(function (v) {
            if (typeof options.only === 'string') {
                const specsToMatch = options.only.split(',');
                let foundSomething = false;
                specsToMatch.forEach(function (s) {
                   if (v.indexOf(s) !== -1) {
                       foundSomething = true;
                   }
                });
                return foundSomething;
            }
            return true;
        });

        options.helpers = resolvePaths(options.helpers, relativeTo);

        utils.each(options.plugins, function (pluginPath, pluginName) {
            let pathToFile = path.resolve(relativeTo, pluginPath);
            let stats = fs.statSync(pathToFile);
            if (stats.isFile()) {
                options.plugins[pluginName] = pathToFile;
            } else {
                delete options.plugins[pluginName];
            }
        });

        utils.cleanDir(options.destDir);

        createFeatherRunnerBundle(options, function () {
            createFeatherSpecBundle(options, relativeTo, function () {
                utils.writeFile(options.destDir + '/test.html', utils.readFile(__dirname + '/lib/test.html'), function () {
                    console.log('\nRun your test in any browser: ' + options.destDir + '/test.html');

                    nodeAsBrowser.init(options.nodeAsBrowser);

                    runSpecsUntilDone(options.specs, options, relativeTo, callback);
                });
            });
        });
    };
}

module.exports = FeatherTestBrowser;
