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

app.post('/add_', function (req, res) {
    // console.log(req);

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
        in_stock: req.body.in_stock
    };

    // console.log(product);

    Products.create(product, function (err, result) {
        if (err) {
            // console.log(err);
            return res.sendStatus(500);
        }
        res.send({error: err || false, item: product});
    });
});

app.post('/q_search', function (req, res) {
    // console.log(req.body.search_for);

    var products_collection = db.get().collection('products'), rx = new RegExp(escapeRegExp(req.body.search_for), "ig");
    
    products_collection.find({"name": rx}).toArray(function (err, results) {
        res.send(results);
        // console.dir(all_products);
    });
    
    
    // Products.find({"name": req.search_for}, function (err, doc) {
    //     if (err) {
    //         console.log(err);
    //         return res.sendStatus(500);
    //     }
    //     res.send(doc);
    // });
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

        products_collection.find().toArray(function (err, results) {
            all_products = results;
            // console.dir(all_products);
        });
    });
});

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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