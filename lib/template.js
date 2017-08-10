
// stripped down from John Resig's micro templating: http://ejohn.org/blog/javascript-micro-templating/
function template (str, data) {
    // escape single quotes (that aren't already escaped)
    str = str.replace(/([^\\])'/g, "$1\\'");
    // replace consecutive spaces and line breaks
    str = str.replace(/[\s\t\r\n\f]+/g, ' ');
    // replace macros with data values
    str = str.replace(/\{\{(.*?)\}\}/g, "',$1,'");

    // Introduce the data as local variables using with(obj){}
    var templateFn = new Function("obj", "var p=[];with(obj){p.push('" + str + "');}return p.join('');");

    return data ? templateFn(data) : templateFn;
}

module.exports = template;
