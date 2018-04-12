function Body (body) {
    let bodyText = '';

    if (typeof body === 'string') {
        bodyText = body;
    } else {
        bodyText = JSON.stringify(body);
    }

    this.bodyUsed = false;
    this.text = function () {
        if (!this.bodyUsed) {
            this.bodyUsed = true;
            return Promise.resolve(bodyText);
        }
    }
}

module.exports = Body;
