# feather-test-browser

<img src="https://travis-ci.org/feather-test/feather-test-browser.svg?branch=master"></img>

**Lightweight test coverage for browser-ready code**

> Runs the easy-to-use [feather-test](https://github.com/seebigs/feather-test) test suite in a [Headless Chrome](https://github.com/GoogleChrome/puppeteer) browser instance

## Install
```
$ npm install feather-test-browser --save-dev
```

## Write Some Tests

*myProject/test/specs/one.spec.js*
```js
describe('gizmo is a mogwai', function () {

    describe('when you feed him after midnight', function () {

        describe('he becomes a gremlin', function (expect) {
            expect(skin).not.toBe('furry');
            expect(temperament).toContain('angry');
            expect(explosions).toBeGreaterThan(99, 'explosions caused by gremlins');
        });

    });

});
```

*myProject/test/specs/two.spec.js*
```js
// example of an asynchronous test
describe('teddy ruxpin is the creepiest bear ever', function () {

    describe('he blinks twice every 3 seconds', function (expect, done) {
        activateTeddy();
        setTimeout(function () {
            expect(timesBlinked).toBe(4);
            done();
        }, 6000);
    });

});
```

*myProject/package.json*
```js
{
  "scripts": {
    "test": "node ./test/run"    
  }
}
```

```
myProject/
  |--test/
  |  |--specs/
  |  |  |--one.spec.js
  |  |  |--two.spec.js
  |  |--run.js
  |--src/
  |  |--etc.
  |--package.json
```

## Run Your Tests
*myProject/test/run.js*
```js
var FeatherTestBrowser = require('feather-test-browser');

// create a new test suite with your spec files
var myTests = new FeatherTestBrowser({
    helpers: './helpers',
    specs: './specs'
});

// run your tests and get a link to run them again in any browser
// (optional callback)
myTests.run(callback);
```

```
$ cd myProject
$ npm test

// You will be given a URL that you can open in any browser on your machine
```

## Notes

- Your tests will automatically be run in command line using Headless Chrome as a background process
- NOTE: the optional callback only executes when your tests are run in command line, not in browser

---

## Configuration and Options
See [feather-test](https://github.com/feather-test/feather-test#configuration-options) for full documentation on assertions, matchers, and other options that are available in feather-test-browser.

## Additional Options

### dirnameAvailable

If set to `true` the global `__dirname` variable will be available for use in specs and helpers. This is set to `false` by default for privacy because this exposes your local machine's user path in the generated bundles.

---

## ES6 with Babel
If you need to run modern code in older browsers you can pass options into the bundler. See [bundl-pack](https://github.com/seebigs/bundl-pack) for more options.
```js
var FeatherTestBrowser = require('feather-test-browser');
var babelProcessor = require('bundl-pack-babel');

var myTests = new FeatherTestBrowser({
    specs: './specs',
    bundlPack: {
        js: babelProcessor({
            presets: ['es2015-ie'],
        })
    }
});
```

## Additional Spec Methods

### external.loadScript
Load external scripts into your spec environment at runtime.
- requires an absolute path reference to a script file (uses `file://` protocol)
- scripts will be loaded asynchronously, but sequentially
```js
describe('try loading a script', function (expect, done) {
    // ext files each execute `window.foo++`

    window.foo = 0;

    external.loadScript('/Users/me/Projects/feather-test-browser/ext1.js', function () {
        expect(window.foo).toBe(1);
    });

    external.loadScript('/Users/me/Projects/feather-test-browser/ext2.js', function () {
        expect(window.foo).toBe(2);
        done();
    });
});
```
