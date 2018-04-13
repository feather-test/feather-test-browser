describe('xhr', () => {

    network.startIntercept();

    describe('overrides in all environments', (expect) => {
        expect(window.XMLHttpRequest.prototype.open.name).toBe('mockOpen', 'browser');
        expect(XMLHttpRequest.prototype.open.name).toBe('mockOpen', 'node');
    });

    describe('intercepts xhr when installed', () => {

        describe('has a default response', (expect, done) => {
            let testUrl = 'http://noresponse.com/empty-xhr';

            let r = new window.XMLHttpRequest();
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    expect(r.status).toBe(200, 'status');
                    expect(r.statusText).toBe('OK', 'statusText');
                    expect(r.response).toBe('', 'response');
                    expect(r.responseText).toBe('', 'responseText');
                    expect(r.responseType).toBe('', 'responseType');
                    done();
                }
            };
            r.open('GET', testUrl, true);
            r.send();
        });

        describe('responds with text', (expect, done) => {
            let testUrl = 'http://greetings.com/say/hello-xhr?a=2&b=3';
            let r = new XMLHttpRequest();
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    expect(r.status).toBe(200, 'status');
                    expect(r.responseText).toBe('hello', 'text');
                    done();
                }
            };
            r.open('GET', testUrl, true);
            r.send();
        });

        describe('responds with complex response mock', (expect, done) => {
            let testUrl = 'http://complex.com/response/complex-xhr';
            let r = new XMLHttpRequest();
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    expect(r.status).toBe(202);
                    expect(r.statusText).toBe('Accepted');
                    expect(r.getAllResponseHeaders().toLowerCase()).toContain('x-custom-header-stuff: foobar');
                    expect(r.getResponseHeader('X-Custom-Header-Stuff')).toBe('foobar');
                    expect(JSON.parse(r.responseText)).toBe({ name: 'fusion' });
                    done();
                }
            };
            r.open('GET', testUrl, true);
            r.send();
        });

        describe('responds with json', (expect, done) => {
            let testUrl = 'http://sub.example.com:3000/cars/ford?model=fusion&doors=4';
            let r = new XMLHttpRequest();
            r.onreadystatechange = function () {
                if (r.readyState === 4) {
                    expect(r.status).toBe(200, 'status');
                    expect(JSON.parse(r.responseText)).toBe({ name:'fusion' }, 'json');
                    done();
                }
            };
            r.open('GET', testUrl, true);
            r.send();
        });

    });

    network.stopIntercept();

});
