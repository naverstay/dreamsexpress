var db_url = 'mongodb://localhost:27017/rags';

var compression = require('compression');
var express = require('express');
var path = require('path');
var logger = require('morgan');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./config/db');
// var productsController = require('./controllers/products');

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var mailer = require('express-mailer');
var slug = require('slug');

var app = express();

global.print = console.log.bind(console, '##>>');

mongoose.Promise = global.Promise;
// assert.equal(query.exec().constructor, global.Promise);

mongoose.connect(db_url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// var Products = require('./models/products');
// var Clients = require('./models/client');

// global.all_products;

// global.user;

// var fieldTypes = {
//     name: 'rx',
//     info: 'rx',
//     main_img: 'str',
//     hover_img: 'str',
//     img_list: 'str',
//     price: 'range',
//     sizes: 'rx',
//     colors: 'rx',
//     adult: 'str',
//     gender: 'str',
//     season: 'str',
//     category: 'str',
//     product_code: 'exact',
//     in_stock: 'bool'
// };

var ageTable = {
    1: 86,
    2: 92,
    3: 98,
    4: 104,
    5: 110,
    6: 116,
    7: 122,
    8: 128,
    9: 134,
    10: 140,
    11: 146,
    12: 152,
    13: 158,
    14: 164
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('strict routing', false);
app.set('case sensitive routing', false);

// app.set('NODE_ENV', 'production');

// app.use(logger('dev'));

app.use(compression());


// required for passport
app.use(session({
    store: new RedisStore(
        {
            host: '127.0.0.1',       //where redis store is
            port: 6379,              //default redis port
            prefix: 'sess',          //prefix for sessions name is store
            pass: 'passwordtoredis'  //password to redis db
        }
    ),
    secret: 'megasecretfordreamSEXpress', // session secret
    name: 'dreamsexpress',
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 60000000}
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/'), {index: 'nope.html'}));
// app.use(express.static(path.join(__dirname, 'public'), {index: 'nope.html'}));
// app.use(express.static(path.join(__dirname, 'dist')));

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

mailer.extend(app, {
    from: 'dreamsexpress.biz@gmail.com',
    host: 'smtp.gmail.com', // hostname 
    secureConnection: true, // use SSL 
    port: 465, // port for secure SMTP 
    transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts 
    auth: {
        user: 'dreamsexpress.biz@gmail.com',
        pass: '3a4f044785DSP6472'
    }
});

require('./routes/routes.js')(app, passport);

db.connect(db_url, function (err) {
    if (err) {
        return console.log(err);
    }
    app.listen(3012, function () {
        console.log('Mongo connected. Listning on 3012.');

        slug.defaults.mode = 'pretty';

        slug.defaults.modes['pretty'] = {
            replacement: '-',
            symbols: true,
            remove: /[.]/g,
            lower: true,
            charmap: slug.charmap,
            multicharmap: slug.multicharmap
        };

        print(slug('НЕЙЛОНОВАЯ КУРТКА-БОМБЕР плащ подъезд'));

        // var products_collection = db.get().collection('products');

        // all_products = productsController.all();

        // console.log('all_products', all_products, products_collection.find());

        // products_collection.find().toArray(function (err, results) {
        //     global.all_products = results;
        // });
    });
});

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
    res.render('error', {error: err, user: req.client_info, title: 'errorHandler'});
}

app.use(function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('error', {url: req.url, user: req.client_info, title: 'ERROR 404'});
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