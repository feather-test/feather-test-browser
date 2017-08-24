
describe('try loading a script', function (expect, done) {
        global.varOne = 0;
        window.varTwo = 0;

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            expect(global.varOne).toBe(1, 'global');
            expect(window.varTwo).toBe(1, 'window');
        });

        external.loadScript(__dirname + '/../fixture/_ext2.js', function () {
            expect(global.varOne).toBe(2, 'global');
            expect(window.varTwo).toBe(2, 'window');
        });

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            expect(global.varOne).toBe(3, 'global');
            expect(window.varTwo).toBe(3, 'window');
            done();
        });
});
