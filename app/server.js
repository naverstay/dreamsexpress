var config = require('./config.json');

//var db_url = config.mongoose.db;
var db_url = config.mongoose.db_lab;

var compression = require('compression');
var express = require('express');
var path = require('path');
// var fs = require('fs');
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
var fileUpload = require('express-fileupload');
var slug = require('slug');

var app = express();

global.print = console.log.bind(console, '##>>');

mongoose.Promise = global.Promise;
// assert.equal(query.exec().constructor, global.Promise);

//mongoose.connect(db_url); // connect to our database

//mongoose.connection.once('open', function () {
//    logger.info('MongoDB event open');
//    logger.debug('MongoDB connected [%s]', db_url);
//
//    mongoose.connection.on('connected', function () {
//        logger.info('MongoDB event connected');
//    });
//
//    mongoose.connection.on('disconnected', function () {
//        logger.warn('MongoDB event disconnected');
//    });
//
//    mongoose.connection.on('reconnected', function () {
//        logger.info('MongoDB event reconnected');
//    });
//
//    mongoose.connection.on('error', function (err) {
//        logger.error('MongoDB event error: ' + err);
//    });
//
//    // return resolve();
//
//    console.log('start server');
//
//    //return server.start();
//});

mongoose.connect(db_url, {
    keepAlive: 1,
    useMongoClient: true,
    reconnectTries: 300,
    connectTimeoutMS: 30000

    //useMongoClient: true
}, function (err) {
    if (err) {
        logger.error('MongoDB connection error: ' + err);
        // return reject(err);
        process.exit(1);
    }
}).then(function (q) {

});

require('./config/passport')(passport); // pass passport for configuration

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
// app.set('view engine', 'jade');
app.set('view engine', 'pug');
app.set('strict routing', false);
app.set('case sensitive routing', false);

// app.set('NODE_ENV', 'production');

// app.use(logger('dev'));

app.use(compression());

app.use(fileUpload({
  // safeFileNames: true,
  limits: {fileSize: 50 * 1024 * 1024}
}));

// required for passport
app.use(session({
  store: new RedisStore(
    {
      host: '127.0.0.1',       //where redis store is
      port: 6379,              //default redis port
      prefix: 'sess',          //prefix for sessions name is store
      pass: config.redis.pass  //password to redis db
    }
  ),
  secret: config.express.session.secret, // session secret
  name: config.express.session.name,
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
  from: config.email.user,
  host: config.email.host, // hostname
  secureConnection: true, // use SSL
  port: config.email.port, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

require('./routes/routes.js')(app, passport);

db.connect(db_url, function (err) {
  if (err) {
    return console.log(err);
  }
  app.listen(config.express.port, function () {
    console.log('Mongo connected to "' + db_url + '" . Node listening on port ' + config.express.port);

    var chars = slug.charmap;

    chars['.'] = '_';
    chars['й'] = 'y';
    chars['Й'] = 'Y';
    chars['щ'] = 'sch';
    chars['Щ'] = 'Sch';

    slug.defaults.mode = 'pretty';

    slug.defaults.modes['pretty'] = {
      replacement: '-',
      symbols: true,
      remove: '',
      lower: true,
      charmap: chars,
      multicharmap: slug.multicharmap
    };

    print('slug example ' + slug('НЕЙЛОНОВАЯ КУРТКА-БОМБЕР платье плащ подъезд'));

    // var products_collection = db.get().collection('products');

    // all_products = productsController.all();

    // console.log('all_products', all_products, products_collection.find());

    // products_collection.find().toArray(function (err, results) {
    //     global.all_products = results;
    // });
  });
});

function logErrors(err, req, res, next) {
    console.error('logErrors(err', err.stack);
    next(err);
}

function clientErrorHandler(err, req, res, next) {
    console.log('clientErrorHandler', err);

    if (req.xhr) {
        res.status(500).send({error: 'Something failed!'});
    } else {
        next(err);
    }
}

function errorHandler(err, req, res, next) {
    console.log('errorHandler', err);

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
