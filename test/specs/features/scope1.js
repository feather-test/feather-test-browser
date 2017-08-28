window.foo = 0;

const one = require('../fixture/one.js');

describe('global state behaves properly', function () {

        describe('globals are shared with required src files', function (expect) {
            expect(window.foo).toBe(2);
        });

        describe('globals are shared with external files that are loaded asynchronously', function (expect, done) {
            window.TestHook = function () {
                expect(window.foo).toBe(4);
                done();
            };

            external.loadScript(__dirname + '/../fixture/_ext1.js');
        });

});
