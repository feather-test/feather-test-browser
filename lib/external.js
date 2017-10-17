/**
 * "External" Plugin for feather-test
 * Inside specs, can globally use `external.loadScript`
 */

module.exports = {
    _queue: [],
    _waiting: false,

    loadScript: function (absPath, onLoad) {
        let methodName = 'external.loadScript';
        if (typeof absPath === 'string') {
            if (absPath.charAt(0) !== '/') {
                throw new Error(methodName + ' requires an absolute path');
            }

            let target = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];

            function doLoad () {
                external._waiting = true;

                var s = document.createElement('script');
                s.type = "text/javascript";
                s.src = 'file://' + absPath;

                s.onload = function () {
                    if (typeof onLoad === 'function') {
                        onLoad();
                    }

                    let next = external._queue.shift();
                    if (next) {
                        next();
                    } else {
                        external._waiting = false;
                    }
                };

                target.appendChild(s);
            }

            if (external._waiting) {
                external._queue.push(doLoad);
            } else {
                doLoad();
            }
        }
    },

};
