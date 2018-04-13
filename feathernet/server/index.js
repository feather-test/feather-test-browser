const requestHandler = require('./requestHandler');
const serverApps = require('./serverApps');

function FeatherNetServer (inputConfig) {
    const defaultConfig = {
        adminPort: 9877,
        port: 9876,
        rootPath: '/',
    };

    let config = Object.assign({}, defaultConfig, inputConfig);

    let featherServer = {
        admin: null,
        adminConnection: null,
        impostor: null,
        impostorConnection: null,
        mocks: [],
        requestHandler: requestHandler,
    };

    serverApps.create(featherServer, config);

    this.start = function () {
        serverApps.start(featherServer);
    };

    this.stop = function () {
        serverApps.stop(featherServer);
    };
}

module.exports = FeatherNetServer;
