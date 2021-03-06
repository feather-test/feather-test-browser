const bundlPack = require('bundl-pack');
const clone = require('./lib/clone.js');
const discoverSourcePath = require('discover-source-path');
const dropFileName = require('./lib/dropFileName.js');
const FeatherNetServer = require('./feathernet/server');
const fs = require('fs');
const Handlebars = require('handlebars');
const path = require('path');
const puppeteer = require('puppeteer');
const tostring = require('./lib/tostring.js');
const utils = require('seebigs-utils');

const pathToFeatherTestBrowser = __dirname;
const pathToFeatherTest = dropFileName(require.resolve('feather-test'));
const pathToFeatherRunner = pathToFeatherTest + '/bundle_ready/runner.js';

const bundlPackOptions = {
    leadingComments: false,
    obscure: true,
};

const includedPlugins = {
    external: __dirname + '/./lib/external.js',
    network: __dirname + '/./feathernet/browser/index.js',
};

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

    let testBundle = bundlPack.create(runnerBundleContents, bundlPackOptions);
    utils.writeFile(options.destDir + '/featherRunner.js', testBundle, done);
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
        specMap: specMap,
    });

    let testBundle = bundlPack.create(specBundleContents, bundlPackOptions);
    fs.createReadStream(__dirname + '/assets/passing.gif').pipe(fs.createWriteStream(options.destDir + '/passing.gif'));
    utils.writeFile(options.destDir + '/featherSpecs.js', testBundle, done);
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

function runChromeHeadless (testUrl, welcomeNote, options, callback) {
    const launchOpts = options.disableSandbox ? {args: ['--no-sandbox', '--disable-setuid-sandbox']} : {};
    puppeteer.launch(launchOpts).then((browser) => {
        browser.newPage().then((page) => {
            console.log(welcomeNote);

            let failed = false;

            function shutdown () {
                page.close().then(() => { browser.close(); });
                if (failed && options.exitProcessWhenFailing) {
                    console.log('Exit Failing');
                    process.exit(1);
                }
                callback();
            }

            page.on('load', (r) => {
                if (page.url().indexOf('state=finished') > 0) {
                    shutdown();
                }
            });

            page.on('pageerror', (errorMessage) => {
                failed = true;
                console.log('');
                console.log(errorMessage);
                shutdown();
            });

            page.on('console', (consoleMessage) => {
                switch (consoleMessage.type()) {
                    case 'info':
                        if (consoleMessage.text().indexOf('Spec Output:') === 0) {
                            // hide from terminal
                        } else {
                            console.log(consoleMessage.text());
                        }
                        break;

                    case 'error':
                        const msg = consoleMessage.text();
                        if (msg.indexOf('Failed to load resource:') !== 0) {
                            failed = true;
                            console.log(msg);
                        }
                        break;

                    default:
                        console.log(consoleMessage.text());
                }
            });

            page.goto(testUrl).catch(console.log);
        }).catch((err) => {
            console.log('Error launching test page: ' + err.message + '\n');
            console.log(err.stack);
            process.exit(1);
        });
    }).catch((err) => {
        console.log('Error launching test browser: ' + err.message + '\n');
        console.log(err.stack);
        process.exit(1);
    });
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
        dirnameAvailable: false,
        disableSandbox: false,
        exitProcessWhenFailing: true,
        helpers: [],
        stopAfterFirstFailure: false,
        timeout: 5000,
    };
    let extendedConfig = Object.assign({}, defaultConfig, config, utils.args());
    extendedConfig.destDir = path.resolve(extendedConfig.destDir);
    extendedConfig.plugins = extendedConfig.plugins || {};
    Object.assign(extendedConfig.plugins, includedPlugins);
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

        if (options.networkIntercept === true) {
            options.networkIntercept = {};
        }

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

        var featherServer;
        if (options.networkIntercept) {
            featherServer = new FeatherNetServer(options.networkIntercept);
            featherServer.start();
        }

        createFeatherRunnerBundle(options, function () {
            createFeatherSpecBundle(options, relativeToAsArray, function () {
                utils.writeFile(options.destDir + '/test.html', utils.readFile(__dirname + '/templates/test.html'), function () {
                    var welcomeNote = '\nRun your test in any browser: ' + options.destDir + '/test.html\n';
                    runChromeHeadless('file://' + options.destDir + '/test.html', welcomeNote, options, function () {
                        if (options.networkIntercept && !options.networkIntercept.keepalive) {
                            featherServer.stop();
                        }
                        if (typeof callback === 'function') {
                            callback();
                        }
                    });
                });
            });
        });
    };
}

module.exports = FeatherTestBrowser;
