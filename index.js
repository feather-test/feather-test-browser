const bundlPack = require('bundl-pack');
const clone = require('./lib/clone.js');
const discoverSourcePath = require('discover-source-path');
const dropFileName = require('./lib/dropFileName.js');
const fs = require('fs');
const Handlebars = require('handlebars');
const nodeAsBrowser = require('node-as-browser');
const path = require('path');
const tostring = require('./lib/tostring.js');
const utils = require('seebigs-utils');

const pathToFeatherTestBrowser = __dirname;
const pathToFeatherTest = dropFileName(require.resolve('feather-test'));
const pathToFeatherRunner = pathToFeatherTest + '/bundle_ready/runner.js';

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
    let bundledOptions = clone(options);

    // hide full paths from the pubilc bundle
    delete bundledOptions.destDir;
    delete bundledOptions.helpers;
    delete bundledOptions.plugins;
    delete bundledOptions.specs;

    let pluginsStr = '';
    utils.each(options.plugins, function (pathToPlugin, pluginName) {
        pluginsStr += 'FeatherTest.addPlugin("' + pluginName + '", require("' + pathToPlugin + '"));\n'
    });

    let helpersStr = '';
    utils.each(options.helpers, function (pathToFile) {
        if (options.dirnameAvailable) {
            let dirname = dropFileName(pathToFile);
            helpersStr += '__dirname = "' + dirname + '";\n';
        }
        helpersStr += 'require.cache.clear();\n';
        helpersStr += 'require("' + pathToFile + '");\n';
    });

    let runnerBundleTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/templates/featherRunner.js', 'utf8'));
    let runnerBundleContents = runnerBundleTemplate({
        helpers: helpersStr,
        options: tostring.fromObject(bundledOptions),
        pathToFeatherRunner: pathToFeatherRunner,
        plugins: pluginsStr,
    });

    let testBundle = bundlPack(bundlPackOptions).one.call({ LINES: runnerBundleContents.split('\n').length + 3 }, runnerBundleContents, {
        name: 'featherRunner.js',
        contents: runnerBundleContents,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherRunner.js', testBundle.contents, done);
}

function createFeatherSpecBundle (options, relativeToAsArray, done) {
    let specMap = '{';
    utils.each(options.specs, function (spec) {
        let dirname = '';
        if (options.dirnameAvailable) {
            dirname = dropFileName(spec);
            dirname = '__dirname = "' + dirname + '"; ';
        }
        specMap += '   "' + getSpecName(spec, relativeToAsArray) + '": function(){ ' + dirname + 'require("' + spec + '"); },\n';
    });
    specMap += '}';

    let specBundleTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/templates/featherSpecs.js', 'utf8'));
    let specBundleContents = specBundleTemplate({
        pathToFeatherTestBrowser: pathToFeatherTestBrowser,
        passingImage: '/assets/finished.gif',
        specMap: specMap,
    });

    let testBundle = bundlPack(bundlPackOptions).one.call({ LINES: specBundleContents.split('\n').length + 3 }, specBundleContents, {
        name: 'featherSpecs.js',
        contents: specBundleContents,
        src: [],
        sourcemaps: []
    });

    utils.writeFile(options.destDir + '/featherSpecs.js', testBundle.contents, done);
}

function getSpecName (specPath, relativeToAsArray) {
    let specName = '';

    if (typeof specPath === 'string') {
        let specPathAsArray = specPath.split('/');
        let pathRemainder = [];
        utils.each(specPathAsArray, function (segment, index) {
            if (segment !== relativeToAsArray[index]) {
                pathRemainder.push(segment);
            }
        });

        specName = pathRemainder.join();
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

function runInNodeUntilDone (specs, options, relativeToAsArray, callback) {
    currentSpecNum++;
    if (currentSpecNum < specs.length) {
        clearRequireCache();
        require(options.destDir + '/featherRunner.js');

        let oldReporter = FeatherTest.reporter.report;
        FeatherTest.reporter.report = function (results) {
            megaResults.passed = megaResults.passed.concat(results.passed);
            megaResults.failed = megaResults.failed.concat(results.failed);
            megaResults.skipped = megaResults.skipped.concat(results.skipped);
        };

        global.FeatherTestBrowserCurrentSpec = getSpecName(options.specs[currentSpecNum], relativeToAsArray);
        require(options.destDir + '/featherSpecs.js');

        FeatherTest.report(function () {
            numberOfAfterSpecCallbacksExecuted += 1;
            if (numberOfAfterSpecCallbacksExecuted === specs.length) {
                oldReporter(megaResults);
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                nodeAsBrowser.init(options.nodeAsBrowser);
                runInNodeUntilDone(specs, options, relativeToAsArray, callback);
            }
        });
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
        stopAfterFirstFailure: false,
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
        let relativeToAsArray = relativeTo.split('/');

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
            createFeatherSpecBundle(options, relativeToAsArray, function () {
                utils.writeFile(options.destDir + '/test.html', utils.readFile(__dirname + '/lib/test.html'), function () {
                    console.log('\nRun your test in any browser: ' + options.destDir + '/test.html\n');

                    nodeAsBrowser.init(options.nodeAsBrowser);

                    runInNodeUntilDone(options.specs, options, relativeToAsArray, callback);
                });
            });
        });
    };
}

module.exports = FeatherTestBrowser;
