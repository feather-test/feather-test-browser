const bodyParser = require('body-parser');
const each = require('seebigs-each');
const express = require('express');
const http = require('http');
const path = require('path');
const URL = require('../utils/url');
const useragent = require('useragent');

function allowCors (app) {
    app.all('*', function (req, res, next) {
        const userAgent = useragent.lookup(req.headers['user-agent']);
        let origin = req.get('Referrer') || req.get('Origin') || req.get('Host') || '*';
        if (origin === 'null' && userAgent.family === 'Chrome' || userAgent.family === 'HeadlessChrome') { origin = 'file://'; }
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        next();
    });
}

function createAdmin (featherServer, serverOptions) {
    featherServer.admin = express();
    let admin = featherServer.admin;

    admin.set('port', serverOptions.adminPort);

    allowCors(admin);

    admin.use(bodyParser.urlencoded({ extended: true }));
    admin.use(bodyParser.text());

    admin.post('/feathernet-addMocks', function (req, res, next) {
        if (req.body) {
            let mocks = JSON.parse(req.body);
            if (Array.isArray(mocks)) {
                each(mocks, function (mock) {
                    let requestMatcher = mock.request;
                    let responseMock = mock.response;

                    if (typeof requestMatcher === 'string') {
                        requestMatcher = {
                            contains: {
                                url: {
                                    hostpath: requestMatcher,
                                },
                            },
                        };
                    }

                    featherServer.mocks.push({
                        request: requestMatcher,
                        response: responseMock,
                    });
                });
            }
        }
        res.send('');
    });

    admin.post('/feathernet-clearMocks', function (req, res, next) {
        featherServer.mocks = [];
        res.send('');
    });

    admin.get('/feather', function (req, res) {
        res.sendFile(path.resolve(__dirname + '/../feather/test.html'));
    });

    admin.get('/test.js', function (req, res) {
        res.sendFile(path.resolve(__dirname + '/../feather/test.js'));
    });
}

function createImpostor (featherServer, serverOptions) {
    featherServer.impostor = express();
    let impostor = featherServer.impostor;

    impostor.set('port', serverOptions.port);
    impostor.set('rootPath', path.resolve(serverOptions.rootPath));

    allowCors(impostor);

    impostor.options('*', function (req, res) {
        res.send();
    });

    impostor.all('*', function (req, res, next) {
        let responsePlan = featherServer.requestHandler(req, featherServer);

        if (responsePlan.headers) {
            res.set(responsePlan.headers);
            res.set('Access-Control-Expose-Headers', Object.keys(responsePlan.headers).join());
        }

        if (responsePlan.file) {
            res.sendFile(path.resolve(responsePlan.file));
        } else {
            res.status(responsePlan.status);
            res.type(responsePlan.type);
            res.send(responsePlan.body);
        }
    });
}

function create (featherServer, serverOptions) {
    serverOptions = serverOptions || {};
    createAdmin(featherServer, serverOptions);
    createImpostor(featherServer, serverOptions);
}

function start (featherServer) {
    let admin = featherServer.admin;
    featherServer.adminConnection = http.createServer(admin).listen(admin.get('port'));
    let impostor = featherServer.impostor;
    featherServer.impostorConnection = http.createServer(impostor).listen(impostor.get('port'));
    console.log(`FeatherNet started at localhost:${impostor.get('port')} => ${impostor.get('rootPath')}`);
    console.log('Press Ctrl+C to terminate');
}

function stop (featherServer) {
    if (featherServer.impostorConnection) {
        featherServer.impostorConnection.close()
    }
    featherServer.impostorConnection = null;
    featherServer.impostor = null;

    if (featherServer.adminConnection) {
        featherServer.adminConnection.close()
    }
    featherServer.adminConnection = null;
    featherServer.admin = null;
}

module.exports = {
    create,
    start,
    stop,
};
