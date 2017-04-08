var Products = require('../models/products');
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
            console.log(err);
            return res.sendStatus(500);
        }
        console.log(docs);
        res.send(docs);
    });
};

exports.findById = function (req, res) {
    Products.findById(req.params.id, function (err, doc) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    });
};

exports.findByName = function (req, res) {
    console.log(req);

    Products.findByName(req.params.name, function (err, doc) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    });
};

exports.create = function (req, res) {
    // console.log(req.body);

    var product = {
        name: req.body.product_name,
        info: req.body.product_info,
        main_img: req.body.product_main_img,
        hover_img: req.body.product_hover_img,
        img_list: req.body.product_img_list,
        price: 1 * (req.body.product_price),
        sizes: req.body.product_sizes,
        colors: req.body.product_colors,
        adult: req.body.product_adult ? true : false,
        gender: req.body.product_gender,
        season: req.body.product_season,
        category: req.body.product_category,
        product_code: 1 * (req.body.product_code),
        in_stock: req.body.in_stock ? true : false
    };

    Products.create(product, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(result);
    });
};

exports.filter = function (req, res) {
    var params = removeEmpty(req.body);

    for (var i in params) {
        params[i] = paramTypeFix(params[i], fieldTypes[i]);
    }

    console.log(req.body, params);

    Products.filter(params, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(result);
    });
};

exports.update = function (req, res) {
    Products.update(
        req.params.id,
        {name: req.body.name},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
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