xdescribe('global isolation', function () {

    describe('globals do not bleed between spec files', function (expect) {
        expect(global.varOne).toBe(void 0, 'varOne');
        expect(window.varTwo).toBe(void 0, 'varTwo');
        expect(global.varThree).toBe(void 0, 'varThree');
    });

});
