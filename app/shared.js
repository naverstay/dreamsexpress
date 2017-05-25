// global functions

function isObjectID(str) {
    var rxObjectID = new RegExp("^[0-9a-fA-F]{24}$");
    return rxObjectID.test(str);
}

function isArray(test) {
    // Use compiler's own isArray when available
    if (test.isArray) {
        return test.isArray;
    }

    // Retain references to variables for performance
    // optimization
    var objectToStringFn = Object.prototype.toString,
        arrayToStringResult = objectToStringFn.call([]);

    return function (subject) {
        return objectToStringFn.call(subject) === arrayToStringResult;
    };
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function RXify(str) {
    return new RegExp(escapeRegExp(str), "ig");
}

function removeEmpty(obj) {
    Object.keys(obj).forEach(function (key) {
        if (obj[key] && typeof obj[key] === 'object') {
            removeEmpty(obj[key])
        } else if (obj[key] === null) {
            delete obj[key]
        }
    });
    return obj;
}

function checkSlash(str) {
    return str.slice(0, 1) == '/' ? str : '/' + str;
}

function formatPrice(s) {
    return ('' + s).replace(/(?!^)(?=(\d{3})+(?=\.|$))/gm, ' ');
}

function isHex(h) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(h.trim());
}

module.exports = {
    isObjectID: isObjectID,
    escapeRegExp: escapeRegExp,
    RXify: RXify,
    removeEmpty: removeEmpty,
    checkSlash: checkSlash,
    formatPrice: formatPrice,
    isHex: isHex,
    isArray: isArray
};