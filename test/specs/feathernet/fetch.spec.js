const mocks = require('../../helpers/mocks.js');

describe('fetch', () => {

    mocks.on();

    describe('overrides in all environments', (expect) => {
        expect(window.fetch.name).toBe('mockFetch', 'browser');
        expect(fetch.name).toBe('mockFetch', 'node');
    });

    describe('intercepts fetch when installed', () => {

        describe('has a default response', (expect, done) => {
            let testUrl = 'http://noresponse.com/empty-fetch';
            fetch(testUrl)
                .then((response) => {
                    if (response && response.ok) {
                        response.text().then(function (text) {
                            expect(response.status).toBe(200, 'status');
                            expect(response.statusText).toBe('OK', 'statusText');
                            expect(text).toBe('', 'text');
                            done();
                        });
                    } else {
                        expect('response from ' + testUrl).toBe('ok');
                        done();
                    }
                });
        });

        describe('responds with text', (expect, done) => {
            let testUrl = 'http://greetings.com/say/hello-fetch?a=2&b=3';
            window.fetch(testUrl)
                .then((response) => {
                    if (response && response.ok) {
                        response.text().then(function (text) {
                            expect(response.status).toBe(200, 'status');
                            expect(text).toBe('hello');
                            done();
                        });
                    } else {
                        expect('response from ' + testUrl).toBe('ok');
                        done();
                    }
                });
        });

        describe('responds with complex response mock', (expect, done) => {
            let testUrl = 'http://complex.com/response/complex-fetch';
            window.fetch(testUrl)
                .then((response) => {
                    if (response && response.ok) {
                        response.json().then(function (json) {
                            expect(response.status).toBe(202, 'status');
                            expect(response.statusText).toBe("Accepted", 'statusText');
                            expect(response.headers.get('X-Custom-Header-Stuff')).toBe('foobar');
                            expect(json).toBe({ name: 'fusion' });
                            done();
                        });
                    } else {
                        expect('response from ' + testUrl).toBe('ok with valid json');
                        done();
                    }
                });
        });

        describe('responds to complex request matcher with json', (expect, done) => {
            let testUrl = 'http://sub.example.com:3000/cars/ford?model=fusion&doors=4';
            window.fetch(testUrl, { credentials: 'include' })
                .then((response) => {
                    if (response && response.ok) {
                        response.json().then(function (json) {
                            expect(response.status).toBe(200, 'status');
                            expect(json).toBe({ name: 'fusion' });
                            done();
                        });
                    } else {
                        expect('response from ' + testUrl).toBe('ok with valid json');
                        done();
                    }
                });
        });

        describe('handles error', (expect, done) => {
            let testUrl = 'http://errors.com/error-fetch';
            window.fetch(testUrl)
                .then((response) => {
                    expect(response.ok).toBe(false);
                    done();
                });
        });

        describe('handles failure', (expect, done) => {
            window.fetch()
                .then((response) => {
                    expect('response from ' + testUrl).toBe('an error');
                    done();
                })
                .catch(function (err) {
                    expect(Object.prototype.toString.call(err)).toBe('[object Error]');
                    done();
                });
        });

    });

    mocks.off();

});
