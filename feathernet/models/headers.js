function Headers (init) {
    Object.assign(this, init);

    this.get = function (name) {
        return this[name];
    };
}

module.exports = Headers;
