
network.addMocks([
    {
        request: 'noresponse.com'
    },
    {
        request: 'errors.com',
        response: {
            status: 500,
        }
    },
    {
        request: 'greetings.com',
        response: 'hello',
    },
    {
        request: 'complex.com/response',
        response: {
            status: 202,
            headers: {
                'X-Custom-Header-Stuff': 'foobar',
            },
            body: { name: 'fusion' },
        },
    },
    {
        request: {
            exact: {
                method: 'GET',
                headers: {},
                url: {
                    hostpath: 'sub.example.com:3000/cars/ford',
                    protocol: 'http:',
                    host: 'sub.example.com:3000',
                    hostname: 'sub.example.com',
                    port: '3000',
                    pathname: '/cars/ford',
                    params: {
                        model: 'fusion',
                        doors: '4',
                    },
                },
            },
            contains: {
                method: 'ET',
                url: {
                    host: 'ample',
                    params: {
                        model: 'fusion',
                    },
                },
            },
        },
        response: {
            body: { name: 'fusion' },
        },
    },
    {
        request: '/javascripts/somefile.js',
        response: {
            file: __dirname + '/../specs/fixture/somefile.js',
        }
    },
]);
