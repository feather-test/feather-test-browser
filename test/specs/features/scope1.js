global.varOne = 0;
window.varTwo = 0;
global.varThree = 0;

const one = require('../fixture/one.js');

describe('global state behaves properly', function (expect, done) {

        describe('globals are shared with required src files', function () {
            expect(varThree).toBe(2, 'varThree');
        });

        // external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
        //     expect(global.varOne).toBe(1, 'global');
        //     expect(window.varTwo).toBe(1, 'window');
        // });
        //
        // external.loadScript(__dirname + '/../fixture/_ext2.js', function () {
        //     expect(global.varOne).toBe(2, 'global');
        //     expect(window.varTwo).toBe(2, 'window');
        // });
        //
        // external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
        //     expect(global.varOne).toBe(3, 'global');
        //     expect(window.varTwo).toBe(3, 'window');
        //     done();
        // });

        done();

});
