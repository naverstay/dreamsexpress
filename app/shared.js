// global functions

var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;

function checkSlash(str) {
    return str.slice(0, 1) === '/' ? str : '/' + str;
}

function cleanUp(file) {
    if (file && file.length) {

        var target = '.' + checkSlash(file);

        fs.stat(target, function (err, stats) {
            // console.log(stats);

            if (err) {
                return console.error(err);
            }

            if (/^\.\/upload/i.test(target) && stats.isFile()) {
                fs.unlink(target, function (err) {
                    if (err) return console.log(err);
                    console.log('file "' + target + '" deleted successfully');
                });
            } else {
                console.log('file "' + target + '" not deleted');
                //res.status(200).send({remove_done: false, fail_msg: 'Удаление запрещено.'});
            }
        });
    }
}

function isDateValid(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
        return !isNaN(d.getTime());
    } else {
        return false;
    }
}

function leadZero(t) {
    return ('0' + t).slice(-2);
}

function articleTime(d) {
    return (isDateValid(d) ? leadZero(d.getDate()) + "." + leadZero(d.getMonth() + 1) + "." + d.getFullYear() + " в " + leadZero(d.getHours()) + ":" + leadZero(d.getMinutes()) : '');
}

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
    return ('' + str).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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

function formatPrice(s) {
    return ('' + s).replace(/(?!^)(?=(\d{3})+(?=\.|$))/gm, ' ');
}

function isHex(h) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(h.trim());
}

module.exports = {
    cleanUp: cleanUp,
    articleTime: articleTime,
    getObjectID: ObjectID,
    isObjectID: isObjectID,
    escapeRegExp: escapeRegExp,
    RXify: RXify,
    removeEmpty: removeEmpty,
    checkSlash: checkSlash,
    formatPrice: formatPrice,
    isHex: isHex,
    isArray: isArray
};
