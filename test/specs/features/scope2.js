describe('global isolation', function () {

    describe('vars on window do not bleed between spec files', function (expect) {
        expect(window.foo).toBe(void 0);
    });

});
