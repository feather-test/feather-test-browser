# feather-test-browser

**Lightweight test coverage for browser-ready code**

*Refactor safely -- without configuring a burdensome test suite*

> Runs on the easy-to-use [feather-test](https://github.com/seebigs/feather-test) library

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

- Your browser-ready tests will automatically be run in NodeJS via [node-as-browser](https://github.com/seebigs/node-as-browser)
- WARNING: the optional callback executes when run in NodeJS but cannot be passed into the browser environment

---

## Configuration and Options
See [feather-test](https://github.com/seebigs/feather-test) for full documentation on assertions, matchers, and other options that are available in feather-test-browser.

## Additional Spec Methods
*The following plugins are added in browser mode*

### external
Load external scripts into your spec environment at runtime.
- only available in browser mode
- requires an absolute path reference to a script file (uses `file://` protocol)
- scripts will be loaded asynchronously, but sequentially
- console.log from within an external script does not output to terminal
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