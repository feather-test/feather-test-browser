function Json () {
    this.json = function() {
        return this.text().then(function (text) {
            return JSON.parse(text);
        }).catch(function (e) {
            return;
        });
    }
}

module.exports = Json;
