const mocks = require('../../helpers/mocks.js');

describe('calls', () => {

    mocks.on();

    describe('fetch collects calls', (expect) => {
        fetch('http://noresponse.com/calls-fetch');
        fetch('http://noresponse.com/calls-fetch');
        fetch('https://greetings.com/calls-fetch');

        expect(fetch.calls[2].url).toBe('https://greetings.com/calls-fetch');
    });

    describe('xhr collects calls', (expect) => {
        let a = new XMLHttpRequest();
        a.open('GET', 'http://noresponse.com/calls-xhr', true);
        a.send();

        let b = new XMLHttpRequest();
        b.open('GET', 'http://noresponse.com/calls-xhr', true);
        b.send();

        let c = new XMLHttpRequest();
        c.open('GET', 'https://greetings.com/calls-xhr', true);
        c.send();

        expect(XMLHttpRequest.calls[2].url).toBe('https://greetings.com/calls-xhr');
    });

    describe('sendBeacon collects calls', (expect) => {
        navigator.sendBeacon('http://noresponse.com/calls-sendbeacon');
        navigator.sendBeacon('http://noresponse.com/calls-sendbeacon');
        navigator.sendBeacon('https://greetings.com/calls-sendbeacon');

        expect(navigator.sendBeacon.calls[2].url).toBe('https://greetings.com/calls-sendbeacon');
    });

    mocks.off();

});
