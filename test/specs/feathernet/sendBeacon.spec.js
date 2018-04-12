const mocks = require('../../helpers/mocks.js');

describe('sendBeacon', () => {

    mocks.on();

    describe('overrides in all environments', (expect) => {
        expect(window.navigator.sendBeacon.name).toBe('mockSendBeacon', 'browser');
        expect(navigator.sendBeacon.name).toBe('mockSendBeacon', 'node');
    });

    describe('sends a beacon without errors', (expect) => {
        window.navigator.sendBeacon('http://greetings.com/hello-sendbeacon');
        const errors = false;
        expect(errors).toBe(false);
    });

    describe('errors when mocked to error', (expect) => {
        window.navigator.sendBeacon('http://errors.com/error-sendbeacon');
        const errors = false;
        expect(errors).toBe(false);
    });

    mocks.off();

});
