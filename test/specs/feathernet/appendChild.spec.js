const mocks = require('../../helpers/mocks.js');

describe('appendChild', () => {

    mocks.on();

    describe('overrides in all environments', (expect) => {
        expect(window.navigator.sendBeacon.name).toBe('mockSendBeacon', 'browser');
        expect(navigator.sendBeacon.name).toBe('mockSendBeacon', 'node');
    });

    describe('appends a normal div to the dom', (expect) => {
        let div = document.createElement('div');
        div.id = 'append_test_div'
        div.innerHTML = 'DIVHERE';
        document.body.appendChild(div);
        expect(document.getElementById('append_test_div').innerHTML).toBe('DIVHERE');
    });

    describe('appends a script tag and executes the mocked file', (expect, done) => {
        let script = document.createElement('script');
        script.src = '//cdn.net/javascripts/somefile.js';
        script.onload = function () {
            expect(window.javascriptLoaded).toBe(true);
            done();
        }
        document.body.appendChild(script);
    });

    mocks.off();

});
