var Products = require('../models/products');

exports.all = function (req, res) {
    Products.all(function (err, docs) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
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
    
    Products.findByName(req.params.search_for, function (err, doc) {
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
        price: req.body.product_price,
        sizes: req.body.product_sizes,
        colors: req.body.product_colors,
        adult: req.body.product_adult,
        gender: req.body.product_gender,
        season: req.body.product_season,
        category: req.body.product_category,
        product_code: req.body.product_code,
        in_stock: req.body.in_stock ? true : false
    };
    
    Products.create(product, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(product);
    });
};

exports.filter = function (req, res) {
    // console.log(req.body);

    var product = {
        name: req.body.product_name,
        info: req.body.product_info,
        main_img: req.body.product_main_img,
        hover_img: req.body.product_hover_img,
        img_list: req.body.product_img_list,
        price: req.body.product_price,
        sizes: req.body.product_sizes,
        colors: req.body.product_colors,
        adult: req.body.product_adult,
        gender: req.body.product_gender,
        season: req.body.product_season,
        category: req.body.product_category,
        product_code: req.body.product_code,
        in_stock: req.body.in_stock ? true : false
    };
    
    Products.create(product, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(product);
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
