
describe('try loading a script', function (expect, done) {
        console.log('GLOBAL SET');
        global.foo = 0;

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            console.log('GLOBAL CHECK');
            expect(global.foo).toBe(1);
        });

        external.loadScript(__dirname + '/../fixture/_ext2.js', function () {
            expect(global.foo).toBe(2);
        });

        external.loadScript(__dirname + '/../fixture/_ext1.js', function () {
            expect(global.foo).toBe(3);
            done();
        });
});
