
function intercept (origUrl, hostOverride, mockMethod) {
    if (origUrl && origUrl.indexOf(`http://${hostOverride}/`) !== 0) {
        let newUrl = `http://${hostOverride}/${origUrl}`;
        mockMethod.calls.push({
            url: origUrl,
        });
        return newUrl;
    }
    return origUrl;
}

module.exports = intercept;
