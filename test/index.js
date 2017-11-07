/**
 * Run automated validations
 */

var chalk = require('chalk');
var fs = require('fs');
var utils = require('seebigs-utils');

// override console.log so we can validate output
var LOG = {
    history: [],
    out: console.log
};
console.log = function (msg) {
    LOG.history.push(msg);
    LOG.out(msg);
};
console.log.real = LOG.out;

var validate = {

    all: function (actual, expected) {
        var unexpectedResults = false;
        utils.each(actual, function (entry, i) {
            if (entry !== expected[i] && expected[i] !== '*') {
                LOG.out(chalk.red('   ✘ Expected "' + entry + '" to read "' + expected[i] + '"'));
                unexpectedResults = true;
                return false;
            }
        });
        if (!unexpectedResults) {
            LOG.out(chalk.green('\n   ✔ output is good\n'));
        } else {
            process.exit(1);
        }
    },

    one: function (issues, actual, expected) {
        if (actual !== expected) {
            issues.push(chalk.red('\n   ✘ Expected "' + actual + '" to read "' + expected + '"\n'));
        }
    }

};

require('./configurations/passing.js')(function () {
    let bundledTestFile = fs.readFileSync(__dirname + '/../feather/featherSpecs.js', 'utf8');
    if (bundledTestFile.indexOf('let ') !== -1) {
        LOG.out();
        validate.all(['bundl-pack-babel not working'],['bundl-pack-babel working']);
    }

    require('./configurations/modules.js')(function () {
        require('./configurations/failing.js')(function () {
            require('./configurations/errors.js')(function () {
                require('./configurations/timeout.js')(function () {
                    console.log = LOG.out;
                    console.log();
                    validate.all(LOG.history, [
'*',
'Running specs_features_any',
'Running specs_features_async',
'Running specs_features_clock',
'Running specs_features_helpers',
'Running specs_features_matchers',
'Running specs_features_negated',
'Running specs_features_nested',
'Running specs_features_scope1',
'Running specs_features_scope2',
'Running specs_features_spy',
'\nAll 32 tests passed!',
'\n(1 tests skipped)',
'*',
'Running specs_modules_one_spec',
'Running specs_modules_two_spec',
'\nAll 3 tests passed!',
'*',
'Running specs_features_any',
'Running specs_features_async',
'Running specs_features_clock',
'Running specs_features_helpers',
'Running specs_features_matchers',
'Running specs_features_negated',
'Running specs_features_nested',
'Running specs_features_scope1',
'Running specs_features_scope2',
'Running specs_features_spy',
'\nFailed tests:',
'',
'async',
'   asserts expectations now and later',
'*',
'*',
'',
'matchers',
'*',
'*',
'*',
'*',
'*',
'*',
'*',
'*',
'*',
'*',
'*',
'',
'negated',
'   when mogwai gets wet',
'      he becomes a gremlin',
'*',
'*',
'',
'sponge',
'   when it gets wet',
'      grows',
'*',
'',
'sponge',
'   when it gets wet',
'      does not shrink',
'*',
'',
'sponge',
'   when it gets wet',
'*',
'',
'sponge',
'   when it dries out',
'      shrinks',
'*',
'',
'sponge',
'   when it dries out',
'*',
'',
'additional outer blocks',
'*',
'',
'9 tests failed!',
'\n(1 tests skipped)',
'*',
'Running specs_errors_errors',
'\nFailed tests:',
'',
'handles',
'   errors in assertions',
'*',
'',
'1 tests failed!',
'*',
'Running specs_timeout_timeout',
'\nFailed tests:',
'',
'timeout',
'   is handled properly',
'*',
'',
'1 tests failed!',
                    ]);
                });
            });
        });
    });
});
