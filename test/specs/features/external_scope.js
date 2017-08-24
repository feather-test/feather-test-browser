describe('external_scope', function () {

    describe('globals do not bleed between spec files', function (expect) {
        expect(global.varOne).toBe(void 0, 'global');
        expect(window.varTwo).toBe(void 0, 'window');
    });

});
