
describe('try loading a script', function (expect, done) {
        window.foo = 0;

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            expect(window.foo).toBe(1);
        });

        external.loadScript(__dirname + '/../fixture/_ext2.js', function () {
            expect(window.foo).toBe(2);
        });

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            expect(window.foo).toBe(3);
            done();
        });
});
