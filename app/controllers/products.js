var Products = require('../models/products');
var slug = require('slug');

var fieldTypes = {
    name: 'rx',
    info: 'rx',
    main_img: 'str',
    hover_img: 'str',
    img_list: 'str',
    price: 'range',
    sizes: 'rx',
    colors: 'rx',
    adult: 'str',
    gender: 'str',
    season: 'str',
    category: 'str',
    product_code: 'exact',
    in_stock: 'bool'
};

exports.all = function (req, res) {
    Products.all(function (err, docs) {
        if (err) {
            // console.log(err);
            return res.sendStatus(500);
        }
        // console.log(docs);
        res.send(docs);
    });
};

exports.findById = function (req, res) {
    Products.findById(req.params.id, function (err, doc) {
        if (err) {
            // console.log(err);
            return res.sendStatus(500);
        }

        if (typeof res == 'function') {
            res(doc);
        } else {
            res.send(doc);
        }
    });
};

exports.findByName = function (req, res) {
    // console.log(req);

    Products.findByName(req.params.name, function (err, doc) {
        if (err) {
            // console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    });
};

exports.filter = function (params, cb) {
    Products.filter(params, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        cb(err, result);
    });
};

exports.create = function (req, res) {
    // console.log(req.body);

    var new_name = slug(req.body.product_name), counter = 0;


    function urlMaker() {
        Products.filter({url: new_name}, function (err, results) {
            if (results.length) {
                counter++;
                urlMaker(new_name + '-' + counter);
            } else {
                var product = {
                    name: req.body.product_name,
                    url: new_name,
                    info: req.body.product_info,
                    description: req.body.product_description,
                    main_img: req.body.product_main_img,
                    hover_img: req.body.product_hover_img,
                    img_list: req.body.product_img_list,
                    price: 1 * (req.body.product_price),
                    old_price: 1 * (req.body.product_old_price || 0),
                    sizes: req.body.product_sizes,
                    colors: req.body.product_colors,
                    adult: req.body.product_adult ? true : false,
                    gender: req.body.product_gender,
                    season: req.body.product_season,
                    category: req.body.product_category,
                    product_code: 1 * (req.body.product_code),
                    in_stock: req.body.in_stock ? true : false,
                    is_hit: req.body.is_hit ? true : false
                };

                Products.create(product, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.sendStatus(500);
                    }
                    res.send(result);
                });
            }
        });
    }

    urlMaker(new_name);

};

exports.update = function (req, res) {
    Products.update(
        req.id,
        {url: req.url},
        function (err, result) {
            if (err) {
                console.log(err);
                if (res)
                    return res.sendStatus(500);
            }
            if (res)
                res.sendStatus(200);
        }
    );
};

exports.delete = function (req, res) {
    Products.delete(
        req.params.id,
        function (err, result) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            res.sendStatus(200);
        }
    );
};

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

function paramTypeFix(val, type) {
    var ret;

    switch (type) {
        case "rx":
            ret = RXify(val);
            break;
        case "str":
            break;
        case "range":
            break;
        case "bool":
            break;
        case "exact":
            break;
    }

    return ret || val;
}