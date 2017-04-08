var compression = require('compression');
var express = require('express');
var path = require('path');
var logger = require('morgan');

var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./db');
var productsController = require('./controllers/products');

var app = express();

var Products = require('./models/products');

var all_products;

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('strict routing', false);
app.set('case sensitive routing', false);

// app.set('NODE_ENV', 'production');

// app.use(logger('dev'));

// app.use(compression());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/'), {index: 'nope.html'}));
// app.use(express.static(path.join(__dirname, 'public'), {index: 'nope.html'}));
// app.use(express.static(path.join(__dirname, 'dist')));

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);


app.get('/', function (req, res) {
    res.render('index', {all_products: all_products, title: 'index'});
});

app.get('/product', function (req, res) {
    res.render('product', {all_products: all_products, title: 'product'});
});

app.get('/products', function (req, res) {
    res.render('products', {all_products: all_products, title: 'products'});
});

// app.get('/products/:id', function (req, res) {
//     if (req.params.id) {
//         res.render('product', {all_products: all_products, title: 'Express', id: req.params.id});
//     } else {
//         res.render('products', {all_products: all_products, title: 'Express'});
//     }
// });

app.get('/products/:id', function (req, res, next) {

    console.log(req.originalUrl); // '/admin/new'
    console.log(req.baseUrl); // '/admin'
    console.log(req.path); // '/new'

    console.log('1=========' + JSON.stringify(req.params), (req.params.id).length);
    // if the user ID is 0, skip to the next route
    if ((req.params.id).length) {
        console.log('route');
        next('route');
    } else {
        console.log('else route');

        // otherwise pass the control to the next middleware function in this stack
        next();
    }

}, function (req, res, next) {
    // render a regular page
    console.log('next');

    res.json({
        id: req.param('id'),
        path: req.param(0)
    });

    res.render('products', {all_products: all_products, title: 'regular page'});
});

// handler for the /user/:id path, which renders a special page
app.get('/products/:id', function (req, res, next) {
    console.log('2=========' + JSON.stringify(req.params));

    // res.json({
    //     id: req.param('id'),
    //     path: req.param(0)
    // });

    res.render('product', {all_products: all_products, title: 'product page', id: req.params.id});
});


app.get('/catalog', function (req, res) {
    res.render('catalog', {all_products: all_products, title: 'catalog'});
});

app.get('/cart', function (req, res) {
    res.render('cart', {all_products: all_products, title: 'cart'});
});

app.get('/news', function (req, res) {
    res.render('news', {all_products: all_products, title: 'news'});
});

app.get('/news_1', function (req, res) {
    res.render('news_1', {all_products: all_products, title: 'news_1'});
});

app.get('/lk', function (req, res) {
    res.render('lk', {all_products: all_products, title: 'lk'});
});

app.get('/delivery', function (req, res) {
    res.render('delivery', {all_products: all_products, title: 'delivery'});
});

app.get('/search', function (req, res) {
    res.render('search', {all_products: all_products, title: 'search'});
});

app.get('/add_product', function (req, res) {
    res.render('add_product', {all_products: all_products, title: 'add_product'});
});

// app.post('/q_search', productsController.filter);

app.post('/q_search', function (req, res) {
    console.log(req.body.name);

    var products_collection = db.get().collection('products'), rx = new RegExp(escapeRegExp(req.body.name), "ig");

    products_collection.find({name: rx}).toArray(function (err, results) {
        res.send(results);
    });
});


app.post('/filter', function (req, res) {
    var ret = [], params = removeEmpty(req.body), filter = {};

    for (var field in params) {
        var param = params[field];

        console.log(field, params[field]);

        if ((/name/ig).test(field)) {
            filter['name'] = RXify(param.trim());
        } else if ((/info/ig).test(field)) {
            filter['info'] = RXify(param.trim());
        } else if ((/adult/ig).test(field)) {
            filter['adult'] = (param == 'true');
        } else if ((/gender/ig).test(field)) {
            filter['gender'] = RXify(param);
        } else if ((/season/ig).test(field)) {
            filter['season'] = RXify(param);
        } else if ((/price_min/ig).test(field)) {
            filter['price'] = {
                $gte: parseInt(('' + param).replace(/\D/g, ''))
            };
            
            console.log(params['price_max']);

            if (params['price_max']) {
                filter['price']['$lte'] = parseInt(('' + params['price_max']).replace(/\D/g, ''));
            }
        } else if ((/price_max/ig).test(field)) {
            filter['price'] = {
                $lte: parseInt(('' + param).replace(/\D/g, ''))
            };

            console.log(params['price_min'], filter['price']);
            
            if (params['price_min']) {
                filter['price']['$gte'] = parseInt(('' + params['price_min']).replace(/\D/g, ''));
            }
        }
    }

    console.log('start', req.body, filter);

    var products_collection = db.get().collection('products');

    products_collection.find(filter).toArray(function (err, results) {
        res.send(results);
    });

    // for (var i = 0; i < all_products.length; i++) {
    //     var item = all_products[i];
    //
    //
    // }

    // res.send(all_products);

});

app.get('/artists', productsController.all);

app.get('/artists/:id', productsController.findById);

app.post('/add', productsController.create);

app.put('/artists/:id', productsController.update);

app.delete('/artists/:id', productsController.delete);

db.connect('mongodb://localhost:27017/rags', function (err) {
    if (err) {
        return console.log(err);
    }
    app.listen(3012, function () {
        console.log('Mongo connected. Listning on 3012.');

        var products_collection = db.get().collection('products');

        // all_products = productsController.all();

        // console.log('all_products', all_products, products_collection.find());

        products_collection.find().toArray(function (err, results) {
            all_products = results;
        });
    });
});

function escapeRegExp(str) {
    return ('' + str).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function RXify(str) {
    if (typeof str == 'string') {
        return new RegExp(escapeRegExp(str), "ig");
    }
    
    if (typeof str == 'object') {
        var ret = '';
        for (var i = 0; i < str.length; i++) {
            var item = str[i];
            ret += '|' + item;
        }
        
        return new RegExp(ret.slice(1), "ig");
    }
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

function paramTypeFix(field, val) {
    var ret;

    console.log(val);

    if ((/name|info/ig).test(field)) {
        ret = RXify(val);
    } else if ((/price_min/ig).test(field)) {
        ret = {$gte: 20};
    } else if ((/price_max/ig).test(field)) {
        ret = {$lte: 20};
    } else {
        ret = val;
    }

    // switch (type) {
    //     case "rx":
    //         ret = RXify(val);
    //         break;
    //     case "str":
    //         break;
    //     case "range":
    //         break;
    //     case "bool":
    //         break;
    //     case "exact":
    //         break;
    // }

    return ret;
}

function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.status(500).send({error: 'Something failed!'});
    } else {
        next(err);
    }
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.render('error', {error: err});
}

app.use(function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('error', {url: req.url});
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({error: 'Not found'});
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});