// app/routes.js
module.exports = function (app, passport) {

    var productsController = require('../controllers/products');
    var user = require('../models/user');
    var db = require('../config/db');

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================

    app.get('/', function (req, res) {
        // console.log('req.user', req.user);
        res.render('index', {user: req.user, all_products: global.all_products, title: 'express index'});
    });

    app.get('/login', function (req, res) {
        if (req.user) {
            res.render('lk', {user: req.user, all_products: global.all_products, title: 'lk'});
        } else {
            res.render('login', {user: req.user, all_products: global.all_products, title: 'login'});
        }
    });

    app.get('/product', function (req, res) {
        res.render('product', {user: req.user, all_products: global.all_products, title: 'product'});
    });

    app.get('/products', function (req, res) {
        res.render('products', {user: req.user, all_products: global.all_products, title: 'products'});
    });

// app.get('/products/:id', function (req, res) {
//     if (req.params.id) {
//         res.render('product', {user: req.user, all_products: global.all_products, title: 'Express', id: req.params.id});
//     } else {
//         res.render('products', {user: req.user, all_products: global.all_products, title: 'Express'});
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

        res.render('products', {user: req.user, all_products: global.all_products, title: 'regular page'});
    });

// handler for the /user/:id path, which renders a special page
    app.get('/product_*', function (req, res, next) {
        console.log('2=========' + JSON.stringify(req.params));

        // res.json({
        //     id: req.param('id'),
        //     path: req.param(0)
        // });

        res.render('product', {
            user: req.user,
            all_products: global.all_products,
            title: 'product page',
            id: req.params.id
        });
    });


    app.get('/catalog', function (req, res) {
        res.render('catalog', {user: req.user, all_products: global.all_products, title: 'catalog'});
    });

    app.get('/cart', function (req, res) {
        res.render('cart', {user: req.user, all_products: global.all_products, title: 'cart'});
    });

    app.get('/news', function (req, res) {
        res.render('news', {user: req.user, all_products: global.all_products, title: 'news'});
    });

    app.get('/news_1', function (req, res) {
        res.render('news_1', {user: req.user, all_products: global.all_products, title: 'news_1'});
    });

    app.get('/lk', isLoggedIn, function (req, res) {
        res.render('lk', {user: req.user, all_products: global.all_products, title: 'lk'});
    });

    app.get('/delivery', function (req, res) {
        res.render('delivery', {user: req.user, all_products: global.all_products, title: 'delivery'});
    });

    app.get('/search', function (req, res) {
        res.render('search', {user: req.user, all_products: global.all_products, title: 'search'});
    });

    app.get('/add_product', function (req, res) {
        res.render('add_product', {user: req.user, all_products: global.all_products, title: 'add_product'});
    });

// app.post('/q_search', productsController.filter);

    app.post('/q_search', function (req, res) {
        // console.log(req.body.name);

        var products_collection = db.get().collection('products'), rx = new RegExp(escapeRegExp(req.body.name), "ig");

        products_collection.find({name: rx}).toArray(function (err, results) {
            var items = '';

            for (var i = 0; i < results.length; i++) {
                var item = results[i];

                items +=
                    '<li>' +
                    '<div class="product_item">' +
                    '<a href="product_' + item._id + '" class="product_img">' +
                    '<img src="' + item.main_img + '">' +
                    '<div class="product_hit">Хит продаж</div>' +
                    '<div class="product_share_holder">' +
                    '<div class="product_share">- 30%</div>' +
                    '</div>' +
                    '</a>' +
                    '<h3 class="product_caption">' + item.name + '</h3>' +
                    '<div class="product_price">' +
                    (item.old_price ? '<span class="old_price">' + formatPrice(item.old_price) + '<span> грн.</span></span>' : '') +
                    '<span class="new_price">' + formatPrice(item.price) + '<span> грн.</span></span>' +
                    '</div>' +
                    '</div>' +
                    '</li>';
            }

            res.send({items: items});
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


    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form

    // app.get('/login', function (req, res) {
    //
    //     console.log(req, res);
    //
    //     // render the page and pass in any flash data if it exists
    //     res.render('login', {message: req.flash('loginMessage')});
    // });

    // update user
    app.put('/user', isLoggedIn, function (req, res) {
        console.log(req.session.passport.user);

        user.update({_id: req.session.passport.user}, {
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.first_name,
            lastName: req.body.last_name,
            phone: req.body.displayName,
            address: req.body.address
        }, function (err, numberAffected, rawResponse) {
            console.log(err, numberAffected, rawResponse);

            if (err)
                return done(err, numberAffected, rawResponse);

            res.send({user_updated: true});
            // res.end();
        });

    });

    // GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
    app.get('/auth/google',
        passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login']}));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
    app.get('/auth/google/callback',
        passport.authenticate('google', {failureRedirect: '/login'}),
        function (req, res) {
            res.redirect('/');
        });

    // process the login form
    app.post('/login_lk', passport.authenticate('local-login', {
        successRedirect: '/login_success_lk', // redirect to the secure profile section
        failureRedirect: '/login_failed', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/login_success', // redirect to the secure profile section
        failureRedirect: '/login_failed', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/login_failed', function (req, res) {

        res.send({message: req.flash('loginMessage'), login_failed: true});

        // render the page and pass in any flash data if it exists
        // res.render('signup', { message: req.flash('signupMessage') });
    });

    app.get('/login_success', isLoggedIn, function (req, res) {

        res.send({
            redirectTo: '/',
            user: '<li id="user_lk"><a href="/lk" class="menu_link"><span>' + req.user.local.email + '</span></a></li>',
            user_authenticated: true
        });

        // res.render('profile.ejs', {
        // 	user : req.user // get the user out of session and pass to template
        // });
    });

    app.get('/login_success_lk', isLoggedIn, function (req, res) {

        res.send({redirectTo: '/lk', user_authenticated: true});

        // res.render('profile.ejs', {
        // 	user : req.user // get the user out of session and pass to template
        // });
    });


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/signup_success', // redirect to the secure profile section
        failureRedirect: '/signup_failed', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get('/signup_failed', function (req, res) {

        res.send({message: req.flash('signupMessage')});

        // render the page and pass in any flash data if it exists
        // res.render('signup', { message: req.flash('signupMessage') });
    });

    // =====================================
    // PROFILE SECTION =========================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/signup_success', isLoggedIn, function (req, res) {

        res.send({email: req.user.local.email, user_created: true});

        // res.render('profile.ejs', {
        // 	user : req.user // get the user out of session and pass to template
        // });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.post('/logout', function (req, res) {
        req.logout();

        res.send({redirectTo: '/', logout_done: true});
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

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

function formatPrice(s) {
    return ('' + s).replace(/(?!^)(?=(\d{3})+(?=\.|$))/gm, ' ');
}