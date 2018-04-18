# feather-test-browser

<img src="https://travis-ci.org/feather-test/feather-test-browser.svg?branch=master"></img>

**Lightweight test coverage for browser-ready code**

> Runs the easy-to-use [feather-test](https://github.com/seebigs/feather-test) suite in a [Headless Chrome](https://github.com/GoogleChrome/puppeteer) browser instance

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

---

## Configuration and Options
See [feather-test](https://github.com/feather-test/feather-test#configuration-options) for full documentation on assertions, matchers, and other options that are available in feather-test-browser.

## Additional Options

### dirnameAvailable
If set to `true` the global `__dirname` variable will be available for use in specs and helpers. This is set to `false` by default for privacy because this exposes your local machine's user path in the generated bundles.

### networkIntercept
If set to any truthy value, all network requests will be intercepted and prevented from reaching outside of your test environment. This will also spin up a node server to handle network traffic according to your needs. Mocked responses from the intercept server can be created using the [network](#network) Spec Object. Setting `keepalive` to true will ensure that the server continues to run even after your tests have finished in the terminal so that you can still re-run the tests in any browser.

```js
networkIntercept: true,
```
or
```js
networkIntercept: {
    adminPort: 9877,
    port: 9876,
    rootPath: '/',
    keepalive: true,
},
```

---

## Additional Spec Objects
The following Objects are just available globally within your spec documents...

## network
Used for capturing and mocking network activity. This is especially useful for isolating your test environment and reducing side effects.

### network.startIntercept
Begin intercepting all network traffic.
- overrides fetch, XMLHttpRequest, sendBeacon, and appendChild(<script>)

### network.stopIntercept
Stop intercepting network traffic and reset to normal functionality.

### network.addMocks
Setup mocked responses for matching requests. These mocks will be used only while network traffic is being intercepted. Also, mocks are created in the global scope and can apply to future specs unless cleared. NOTE: mocks can only be used when the [networkIntercept](#networkIntercept) option is set to true.

*more documentation about mocks and how to match requests should be added soon*

### network.clearMocks
Clear any active mocks.

```js
network.clearMocks(); // cleanup mocks from any previous specs

network.addMocks([
    {
        request: 'greetings.com',
        response: 'hello',
    },
]);

describe('responds with text', (expect, done) => {
    network.startIntercept();

    let testUrl = 'http://greetings.com/say/hello?a=2&b=3';
    window.fetch(testUrl)
        .then((response) => {
            if (response && response.ok) {
                response.text().then(function (text) {
                    expect(response.status).toBe(200, 'status');
                    expect(text).toBe('hello');
                    done();
                });
            }
        });

    network.stopIntercept();
});
```

## external
Used for interacting with the environment outside of the test suite

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
