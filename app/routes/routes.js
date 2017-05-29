// app/routes.js

var shared = require('../shared.js');
var config = require('../config.json');

module.exports = function (app, passport) {

  var productsController = require('../controllers/products');
  // var clientsController = require('../controllers/clients');
  var ordersController = require('../controllers/orders');
  var ObjectID = require('mongodb').ObjectID;
  var fs = require('fs');

  // var user = require('../models/user');
  // var User = require('../models/user');

  var Client = require('../models/clients');
  var Order = require('../models/orders');

  // var products = require('../models/products');
  var db = require('../config/db');

  var slug = require('slug');

  var crypto = require('crypto'),
    algorithm = config.encrypt.algorithm,
    password = config.encrypt.password;

  var prod_upload_dir = '/upload/';

  function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  function restrict(req, res, next) {
    req.session.prevPage = /^\/recovery\//i.test(req.body.pathname) ? '/' : req.body.pathname || '/';
    next();
  }

  function add_order(req, res) {

    // console.log(req.body);

    var prod_list = [], order_obj = {}, order_list = req.body;

    for (var k in order_list) {
      if (order_list.hasOwnProperty(k)) {
        if (/^prod_/i.test(k)) {
          order_obj[k] = order_list[k];
        }
      }
    }

    productsController.findById(order_obj.prod_id, function (doc) {
      order_obj['prod_price'] = doc.price;

      prod_list.push(order_obj);

      Order.getLastOrder(function (err, doc) {
        var last_order = {
          last_order: 'info',
          order_number: 0,
          order_date: new Date().toISOString()
        };


        if (doc) {
          last_order = doc;
        } else {
          Order.create(last_order, function (err, numberAffected, rawResponse) {
            if (err)
              return done(err, numberAffected, rawResponse);

            console.log('inited');
          });
        }

        var new_order = {
          client_id: req.user ? ObjectID(req.user._id) : 'anonim',
          client_name: req.body.q_name || '',
          client_phone: req.body.q_phone || '',
          order_date: new Date().toISOString(),
          order_number: last_order.order_number + 1,
          order_status: 'new',
          products: prod_list
        };

        // db.get().collection('orders').save({
        Order.create(new_order, function (err, numberAffected, rawResponse) {
          console.log("last_order._id", last_order._id);

          if (err)
            return done(err, numberAffected, rawResponse);

          Order.update(last_order._id, {
            last_order: 'info',
            order_number: new_order.order_number,
            order_date: new_order.order_date
          }, function (err, result) {

            if (err)
              return done('last_order error', err, result);

            res.send({order_sent: true, success_text: 'Заказ отправлен. Мы свяжемся в ближайшее время.'});

          });
        });
      });


    });


  }

  function favUpdate(list, req, cb) {
    Client.update(req.session.passport.user, {
      first_name: req.client_info.first_name,
      last_name: req.client_info.last_name,
      phone: req.client_info.phone,
      address: req.client_info.address,
      role: req.client_info.role,
      fav: list
    }, function (err, numberAffected, rawResponse) {
      console.log(err, numberAffected, rawResponse);

      if (err)
        return done(err, numberAffected, rawResponse);

      Client.findById(req.user._id, function (err, results) {
        req.client_info = results;
        req.client_info.email = req.user.local.email;

        getFavList(req.client_info.fav, function (html) {
          cb(html);
        });
      });
    });
  }

  function getUserFavList(user_id, cb) {

    if (typeof cb == 'function') {
      cb(ret);
    } else {
      return ret;
    }
  }

  function getFavList(list, cb) {
    var ret = '';

    if (list && list.length) {
      var obj_ids = list.map(function (item) {
        return ObjectID(item);
      });

      productsController.filter({_id: {$in: obj_ids}}, function (err, result) {
        ret = favItemsHtml(result);

        if (typeof cb == 'function') {
          cb(ret);
        }
      });

    } else {
      if (typeof cb == 'function') {
        cb('<div class="favUnitMarker"></div>');
      }
    }
  }

  app.use(function (req, res, next) {
    // var clients_collection = db.get().collection('clients');

    req.client_info = {};

    if (req.user) {
      Client.filter({_id: ObjectID(req.user._id)}, function (err, results) {
        if (results && results.length) {
          req.client_info = JSON.parse(JSON.stringify(results[0]));
        }

        req.client_info.email = req.user.local.email;

        if (req.client_info && req.client_info.fav) {

          var obj_ids = req.client_info.fav.map(function (item) {
            return ObjectID(item);
          });

          req.fav_html = [];

          productsController.filter({_id: {$in: obj_ids}}, function (err, result) {
            req.fav_html = result.slice(0);

            next();
          });
        } else {
          next();
        }
      });

    } else {
      next();
    }
  });

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================

  app.get('/', function (req, res) {
    // console.log('req.user', req.user);

    res.render('index', {
      user: req.client_info,
      all_products: productsController.all(),
      breadcrumbs: [],
      fav_html: req.fav_html,
      title: 'express index'
    });
  });

  app.get('/login', function (req, res) {
    if (req.user) {
      res.redirect('/lk');
    } else {
      res.render('login', {
        user: req.client_info,
        all_products: productsController.all(),
        breadcrumbs: [['Главная', 'Авторизация'], ['/', '']],
        fav_html: req.fav_html,
        title: 'login'
      });
    }
  });

  app.get('/login&email=*', function (req, res) {
    if (req.user) {
      res.redirect('/lk');
    } else {
      res.render('login', {
        user: req.client_info,
        all_products: productsController.all(),
        breadcrumbs: [['Главная', 'Активация аккаунта'], ['/', '']],
        fav_html: req.fav_html,
        email: req.params[0],
        title: 'email confirmed'
      });
    }
  });

  // app.get('/product', function (req, res) {
  //     res.render('product', {
  //         user: req.client_info,
  //         all_products: productsController.all(),
  //         fav_html: req.fav_html,
  //         title: 'product'
  //     });
  // });

  app.get('/products', function (req, res) {
    res.render('products', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'products'
    });
  });

// app.get('/products/:id', function (req, res) {
//     if (req.params.id) {
//         res.render('product', {user: req.client_info, all_products: productsController.all(), fav_html: req.fav_html, title: 'Express', id: req.params.id});
//     } else {
//         res.render('products', {user: req.client_info, all_products: productsController.all(), fav_html: req.fav_html, title: 'Express'});
//     }
// });

  // app.get('/products/:id', function (req, res, next) {
  //
  //     console.log(req.originalUrl); // '/admin/new'
  //     console.log(req.baseUrl); // '/admin'
  //     console.log(req.path); // '/new'
  //
  //     console.log('1=========' + JSON.stringify(req.params), (req.params.id).length);
  //     // if the user ID is 0, skip to the next route
  //     if ((req.params.id).length) {
  //         console.log('route');
  //         next('route');
  //     } else {
  //         console.log('else route');
  //
  //         // otherwise pass the control to the next middleware function in this stack
  //         next();
  //     }
  //
  // }, function (req, res, next) {
  //     // render a regular page
  //     console.log('next');
  //
  //     res.json({
  //         id: req.param('id'),
  //         path: req.param(0)
  //     });
  //
  //     res.render('products', {
  //         user: req.client_info,
  //         all_products: productsController.all(),
  //         fav_html: req.fav_html,
  //         title: 'regular page'
  //     });
  // });

  app.get('/activate/:id', function (req, res, next) {
    var activation_id = decrypt(req.params.id);

    console.log('activate', activation_id);

    if (req.user) {
      console.log(req.user);
      req.logout();
    }

    db.get().collection('users').findOne({_id: ObjectID(activation_id)}, function (err, doc) {

      console.log(doc);

      db.get().collection('clients').save({
        _id: ObjectID(activation_id),
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        role: 'customer',
        fav: []
      }, function (err, numberAffected, rawResponse) {
        console.log(err, numberAffected, rawResponse);

        if (err)
          return done(err, numberAffected, rawResponse);

        res.redirect('/login&email=' + doc.local.email);
      });
    });
  });

// handler for the /user/:id path, which renders a special page

  app.get('/product/:id', function (req, res, next) {
    var filter = [{url: req.params.id}];

    // console.log('2=========', req.params.id, checkForHexRegExp.test(req.params.id));

    if (shared.isObjectID(req.params.id)) {
      filter.push({_id: ObjectID('' + req.params.id)});
    }

    productsController.filter({$or: filter}, function (err, results) {

      if (results.length) {
        res.render('product', {
          user: req.client_info,
          breadcrumbs: [['Главная', 'Каталог', results[0].name], ['/', '/catalog', '']],
          product: results[0],
          fav_html: req.fav_html,
          title: 'product page'
        });
      } else {
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
          res.render('error', {
            url: req.url,
            error: 404,
            user: req.client_info,
            title: 'ERROR 404',
            message: 'Товар не найден'
          });
          return;
        }

        // respond with json
        if (req.accepts('json')) {
          res.send({error: 'Not found'});
          return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
      }
    });
  });

// handler for the /user/:id path, which renders a special page

  app.delete('/product/:id', isLoggedInPost, isAdmin, productsController.delete);

  app.post('/product/:id', function (req, res, next) {
    // console.log('2=========' + JSON.stringify(req.params));

    // res.json({
    //     id: req.param('id'),
    //     path: req.param(0)
    // });

    var filter = [{url: req.params.id}];

    if (shared.isObjectID(req.params.id)) {
      filter.push({_id: ObjectID('' + req.params.id)});
    }

    productsController.filter({$or: filter}, function (err, results) {

      if (results.length) {
        var item = results[0];

// @formatter:off

                var prod_review =
                    '<div class="prod_review_photos"> ' +
                        '<h3>' + item.name + '</h3> ' +
                        buildFotorama(item.is_hit, item.main_img, item.hover_img, item.img_list) +
                    '</div>';

                var prod_review_options = 
                    '<div class="prod_review_options prodReviewOptions">' +
                        '<input class="inp_hidden prodID" value="' + item._id + '" name="prod_id">'+
                        '<dl class="prod_options">' +
                            '<dt>Цвет: </dt>' +
                            '<dd></dd>' +
                        '</dl>' +
                        '<ul class="prod_options_switch">' +
                            colorList(item.colors) +
                        '</ul>' +
                        '<dl class="prod_options"><dt>Размер: </dt><dd>&nbsp;</dd></dl>' +
                        '<ul class="prod_options_switch">' +
                            sizesList(item.sizes) +
                        '</ul>' +
                        '<p>' +
                            (item.description ? item.description : '') +
                        '</p>' +
                        '<div class="footer_info_control"><a class="gl_link" href="/product/' + item.url + '">На страницу товара</a></div>' +
                    '</div>';
// @formatter:on

        var product_fav = '<a href="#" data-id="' + item._id + '" class="prod_fav favBtn' + (checkFav(item._id, req.client_info.fav || []) ? ' favorite' : '') + '"></a>';

        var product_share_holder = (item.old_price ? '<div class="product_share">' + Math.ceil(100 * ((item.price - item.old_price) / item.price )).toFixed() + '%</div>' : '');

        var product_price = '<span class="new_price">' + shared.formatPrice(item.price) +
          '<span class="_cur"> грн.</span></span>' +
          (item.old_price ? '<span class="old_price">' + shared.formatPrice(item.old_price) +
          '<span class="_cur"> грн.</span></span>' : '');

        res.send({
          prod_review: prod_review,
          product_share_holder: product_share_holder,
          product_price: product_price,
          product_fav: product_fav,
          prod_review_options: prod_review_options
        });
      } else {

      }
    });
  });

  app.get('/catalog', function (req, res) {
    res.render('catalog', {
      user: req.client_info,
      all_products: productsController.all(),
      breadcrumbs: [['Главная', 'Каталог'], ['/', '']],
      fav_html: req.fav_html,
      title: 'catalog'
    });
  });

  app.get('/cart', isLoggedIn, function (req, res) {
    res.render('cart', {
      user: req.client_info,
      all_products: productsController.all(),
      breadcrumbs: [['Главная', 'Корзина'], ['/', '']],
      fav_html: req.fav_html,
      title: 'cart'
    });
  });

  app.get('/news', function (req, res) {
    res.render('news', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'news'
    });
  });

  app.get('/news_1', function (req, res) {
    res.render('news_1', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'news_1'
    });
  });

  app.get('/lk', isLoggedIn, function (req, res) {
    res.render('lk', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'lk'
    });
  });

  app.get('/delivery', function (req, res) {
    res.render('delivery', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'delivery'
    });
  });

  app.get('/search', function (req, res) {
    res.render('search', {
      user: req.client_info,
      all_products: productsController.all(),
      breadcrumbs: [['Главная', 'Расширенный поиск'], ['/', '']],
      fav_html: req.fav_html,
      title: 'search'
    });
  });

  app.get('/add_product', isLoggedIn, isAdmin, function (req, res) {
    res.render('add_product', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'add_product'
    });
  });

  app.get('/orders', isLoggedIn, isAdmin, function (req, res) {
    var orders = [];

    ordersController.all(function (err, all_orders) {
      orders = all_orders;
      
      // console.log('/orders', all_orders);

      // for (var i = 0; i < orders.length; i++) {
      //   var order = orders[i];
      //   // console.log('/order', order.products, order.products.length);
      //
      //   for (var j = 0; j < order.products.length; j++) {
      //     var product = order.products[j];
      //     // console.log('/order', product);
      //
      //     productsController.findById(product.prod_id, function (err, doc) {
      //
      //       product['prod_info'] = doc;
      //
      //       console.log(doc, orders[i], product);
      //
      //       // orders[i].products[j] = product;
      //     });
      //   }
      // }

      console.log(orders);

      res.render('orders', {
        user: req.client_info,
        all_orders: orders,
        fav_html: req.fav_html,
        title: 'orders'
      });
    });
  });

  app.get('/edit/:id', isLoggedIn, isAdmin, function (req, res) {
    var filter = [{url: req.params.id}];

    if (shared.isObjectID(req.params.id)) {
      filter.push({_id: ObjectID('' + req.params.id)});
    }

    productsController.filter({$or: filter}, function (err, results) {

      if (results.length) {
        res.render('edit', {
          user: req.client_info,
          // all_products: productsController.all(),
          product: results[0],
          fav_html: req.fav_html,
          title: 'edit product',
          id: results[0]._id
        });
      } else {
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
          res.render('error', {
            url: req.url,
            error: 404,
            user: req.client_info,
            title: 'ERROR 404',
            message: 'Товар не найден'
          });
          return;
        }

        // respond with json
        if (req.accepts('json')) {
          res.send({error: 'Not found'});
          return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
      }
    });
  });

  app.get('/all_products', isLoggedIn, isAdmin, function (req, res) {
    res.render('all_products', {
      user: req.client_info,
      all_products: productsController.all(),
      fav_html: req.fav_html,
      title: 'all_products'
    });
  });

// app.post('/q_search', productsController.filter);


  app.get('/recovery_failed', function (req, res, next) {
    res.send({email: 'error', recovery_failed: true});
  });

  app.get('/recovery_success', function (req, res, next) {
    // console.log(message);

    res.send({email: 'email', recovery_success: true, success_text: 'Инструкции отправлены на e-mail '});
  });


  // reset user password
  app.post('/user', function (req, res) {
    var hash = req.body.pathname.replace(/.*\//ig, ''),
      dcr = decrypt(hash).split(' '),
      id = dcr[0],
      pass = dcr[1],
      time = dcr[2];

    db.get().collection('users').findOne({_id: ObjectID(id)}, function (err, doc) {

      if (doc && doc._id != '') {
        var newUser = new User();

        // console.log('new hash', newUser.generateHash(req.body.new_password));

        db.get().collection('users').updateOne(
          {_id: ObjectID(id)}, {
            local: {
              password: newUser.generateHash(req.body.new_password),
              email: doc.local.email
            }
          }, function (err, result) {
            if (err) {
              // handle error 
              console.log(err);
              res.send('There was an error updating user');
              return;
            }

            res.send({password_reset: true, success_text: 'Пароль изменен'});

          }
        );

      } else {
        res.sendStatus(404);
      }
    });
  });

  app.get('/recovery/:id', function (req, res, next) {
    var hash = req.params.id,
      dcr = decrypt(hash).split(' '),
      id = dcr[0],
      pass = dcr[1],
      time = dcr[2];

    // console.log('recovery/', id, time, new Date() - (new Date(time * 1)));

    if (new Date() - (new Date(time * 1)) > 1000 * 60 * 60 * 24) {

      res.render('pass_reset', {
        title: 'pass reset expired',
        link_expired: true
      });

    } else {
      db.get().collection('users').findOne({_id: ObjectID(id)}, function (err, doc) {

        // console.log(doc);

        if (pass != doc.local.password) {
          res.render('pass_reset', {
            title: 'pass reset expired',
            link_expired: true
          });
        } else if (doc && doc._id != '') {
          res.render('pass_reset', {
            title: 'pass reset',
            user_email: doc.local.email
          });
        } else {
          res.render('pass_reset', {
            title: 'pass reset failed',
            error: true
          });
        }
      });
    }
  });

  app.post('/question', function (req, res) {

    // console.log(req.body, req.protocol + '://', req.get('host'), req.originalUrl);

    app.mailer.send('email_question', {
      to: 'dreamsexpress.biz@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field.  
      subject: 'Вопрос на dreamsexpress', // REQUIRED. 
      name: req.body.name || '<пусто>',
      pathname: req.protocol + '://' + req.get('host') + (req.body.pathname || '<пусто>'),
      phone: req.body.phone || '<пусто>',
      question: req.body.question || '<пусто>'
    }, function (err) {
      if (err) {
        // handle error 
        console.log(err);
        res.send('There was an error sending the email');
        return;
      }

      res.send({question_sent: true, success_text: 'Письмо отправлено'});

    });
  });

  app.post('/recovery', function (req, res) {
    var restore_email = req.body.email;

    console.log(req.body);

    db.get().collection('users').findOne({'local.email': restore_email}, function (err, doc) {
      if (err) {
        // handle error 
        console.log(err);
        res.send('There was an error sending the email');
        return;
      }

      if (doc && doc._id != '') {
        app.mailer.send('email_restore', {
          to: restore_email, // REQUIRED. This can be a comma delimited string just like a normal email to field.  
          subject: 'Восстановление доступа на dreamsexpress', // REQUIRED. 
          confirmation_url: req.protocol + '://' + req.get('host') + '/recovery/' + encrypt(doc._id + ' ' + doc.local.password + ' ' + (new Date().getTime()))
        }, function (err) {
          if (err) {
            // handle error 
            console.log(err);
            // res.send({redirectTo: '/recovery_failed'});
            // res.end(JSON.stringify({email: restore_email, recovery_failed: true}));

            return;
          }

          console.log('email sent');

          // res.setHeader(200, {'Content-Type': 'text/html'});

          // res.end();


          // res.send({success: "Updated Successfully", status: 200});

          // if (options.successRedirect) {
          //     res.statusCode = 302;
          //     res.setHeader('Location', options.successRedirect);
          //     res.setHeader('Content-Length', '0');
          //     res.end();
          //     // return res.redirect(options.successRedirect);
          // }

          // next();

          // res.redirect('/recovery_success');

          // res.send({redirectTo: '/recovery_success'});

          res.send({
            recovery_success: true,
            success_text: 'Инструкции отправлены на e-mail ' + restore_email
          });

        });
      } else {
        // res.send({redirectTo: '/recovery_failed'});

        res.send({recovery_failed: true, fail_text: 'E-mail' + restore_email + ' не зарегистрирован'});

        // res.send({success: "Update Failed", status: 200});

        // res.setHeader(200, {'Content-Type': 'text/html'});
        //
        // res.end();

        // if (options.failureRedirect) {
        //     res.statusCode = 302;
        //     res.setHeader('Location', options.failureRedirect);
        //     res.setHeader('Content-Length', '0');
        //     res.end();
        //
        //     // return res.redirect(options.failureRedirect);
        // }


      }
    });
  });

  app.post('/one_click_buy', add_order);

  app.post('/cart', add_order);

  // quick search

  app.post('/q_search', function (req, res) {
    // console.log(req.body.name);

    var rx = new RegExp(shared.escapeRegExp(req.body.name), "ig");

    // products_collection.find({name: rx}).toArray(function (err, results) {
    productsController.filter({name: rx}, function (err, results) {
      var items = '';

      for (var i = 0; i < results.length; i++) {
        var item = results[i];

        items +=
          '<li>' +
          '<div class="product_item">' +
          '<a href="/product/' + item.url + '" class="product_img">' +
          '<img src="' + shared.checkSlash(item.main_img) + '">' +
          (item.is_hit ? '<div class="product_hit">Хит продаж</div>' : '') +
          (item.old_price ? '<div class="product_share_holder">' +
          '<div class="product_share">' + Math.ceil(100 * ((item.price - item.old_price) / item.price )).toFixed() + '%</div>' +
          '</div>' : '') +
          '</a>' +
          '<h3 class="product_caption">' + item.name + '</h3>' +
          '<div class="product_price">' +
          (item.old_price ? '<span class="old_price">' + shared.formatPrice(item.old_price) + '<span> грн.</span></span>' : '') +
          '<span class="new_price">' + shared.formatPrice(item.price) + '<span> грн.</span></span>' +
          '</div>' +
          '</div>' +
          '</li>';
      }

      res.send({items: items});
    });
  });

  // filter

  app.post('/filter', function (req, res) {
    var params = shared.removeEmpty(req.body), filter = {}, sort = {};

    for (var field in params) {
      var param = params[field];

      // console.log(field, params[field]);

      if ((/price_desc/ig).test(field)) {
        sort['price_desc'] = (param == 'desc') || false;
      }

      if ((/name/ig).test(field) && param.length) {
        filter['name'] = shared.RXify(param.replace(/[!@#%&=`~\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '').trim());
      } else if ((/info/ig).test(field)) {
        filter['info'] = shared.RXify(param.trim());
      } else if ((/adult/ig).test(field)) {
        filter['adult'] = (param == 'true');
      } else if ((/in_stock/ig).test(field)) {
        filter['in_stock'] = (param == 'on');
      } else if ((/is_hit/ig).test(field)) {
        filter['is_hit'] = (param == 'on');
      } else if ((/gender/ig).test(field)) {
        filter['gender'] = shared.RXify(param);
      } else if ((/season/ig).test(field)) {
        filter['season'] = shared.RXify(param);
      } else if ((/size/ig).test(field)) {
        filter['size'] = shared.RXify(param);
      } else if ((/price_min/ig).test(field)) {
        filter['price'] = {
          $gte: parseInt(('' + param).replace(/\D/g, ''))
        };

        // console.log(params['price_max']);

        if (params['price_max']) {
          filter['price']['$lte'] = parseInt(('' + params['price_max']).replace(/\D/g, ''));
        }
      } else if ((/price_max/ig).test(field)) {
        filter['price'] = {
          $lte: parseInt(('' + param).replace(/\D/g, ''))
        };

        // console.log(params['price_min'], filter['price']);

        if (params['price_min']) {
          filter['price']['$gte'] = parseInt(('' + params['price_min']).replace(/\D/g, ''));
        }
      }
    }

    function sortFunc(a, b) {
      if (sort['price_desc']) {
        return b.price - a.price;
      } else if (!sort['price_desc']) {
        return a.price - b.price;
      }
      return 0;
    }

    var count = 0;
    for (var k in filter) {
      if (filter.hasOwnProperty(k)) {
        ++count;
      }
    }

    // console.log('start', req.body, filter, count);

    if (count > 1) {
      // var products_collection = db.get().collection('products');

      // products_collection.find(filter).toArray(function (err, results) {
      productsController.filter(filter, function (err, results) {
        var items = '';

        results.sort(sortFunc);

        for (var i = 0; i < results.length; i++) {
          var item = results[i];

          // productsController.update({
          //     url: slug(item.name),
          //     id: item._id
          // });

// @formatter:off

                    items +=
                        '<li>' +
                            '<div class="product_item">' +
                                '<a href="/product/' + item.url + '" class="product_img">' +
                                    '<img src="' + shared.checkSlash(item.main_img) + '">' +
                                    (item.hover_img ? '<div class="hover_img prod_hover"><img src="' + shared.checkSlash(item.hover_img) + '"></div>' : '') +
                                    (item.is_hit ? '<div class="product_hit">Хит продаж</div>' : '') +
                                    '<div class="product_share_holder">' +
                                        '<span data-id="' + item._id + '" class="prod_hover prod_fav favBtn' + (checkFav(item._id, req.client_info.fav || []) ? ' favorite' : '') + '"></span>' +
                                        (item.old_price ? '<div class="product_share">' + Math.ceil(100 * ((item.price - item.old_price) / item.price )).toFixed() + '%</div>' : '') +
                                    '</div>' +
                                    '<div class="product_q_review violette_btn prod_hover openReview mob_hidden">Быстрый просмотр</div>' +
                                '</a>' +
                                '<h3 class="product_caption">' + item.name + '</h3>' +
                                '<div class="product_price">' +
                                    (item.old_price ? '<span class="old_price">' + shared.formatPrice(item.old_price) + '<span> грн.</span></span>' : '') +
                                    '<span class="new_price">' + shared.formatPrice(item.price) + '<span> грн.</span></span>' +
                                '</div>' +
                                '<div class="product_item_overview prod_hover">' +
                                    '<p>Цвета и размеры в наличии</p>' +
                                    '<ul class="prod_colors">' +
                                         colorRender(item.colors) +
                                    '</ul>' +
                                    '<div class="prod_sizes">' + item.sizes + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</li>';

// @formatter:on

        }

        res.send({items: items, count: results.length});
      });
    } else {
      res.status(200).send({items: '', count: -1});
    }

  });

  app.post('/add', isLoggedInPost, productsController.create);


  // app.get('/artists', productsController.all);
  //
  // app.get('/artists/:id', productsController.findById);


  // app.put('/artists/:id', productsController.update);
  //
  // app.delete('/artists/:id', productsController.delete);


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
  app.put('/user', isLoggedInPost, function (req, res) {
    // console.log('req.session.passport.user /put', req.session.passport.user, req.body);

    Client.update(req.session.passport.user, {
      // email: req.body.email,
      // password: req.body.client_password,
      first_name: req.body.client_first_name,
      last_name: req.body.client_last_name,
      phone: req.body.client_phone,
      address: req.body.client_address,
      role: req.client_info.role,
      fav: req.client_info.fav || []
    }, function (err, numberAffected, rawResponse) {
      console.log(err, numberAffected, rawResponse);

      if (err)
        return done(err, numberAffected, rawResponse);

      res.send({user_updated: true, success_text: 'Данные сохранены'});
      // res.end();
    });
  });

  // file remove
  app.post('/remove', function (req, res) {
    var target = '.' + shared.checkSlash(req.body.remove);

    fs.stat(target, function (err, stats) {
      // console.log(stats);

      if (err) {
        return console.error(err);
      }

      if (/^\.\/uploads/i.test(target) && stats.isFile()) {
        fs.unlink(target, function (err) {
          if (err) return console.log(err);
          console.log('file "' + target + '" deleted successfully');
          res.status(200).send({remove_done: true});
        });
      } else {
        res.status(200).send({remove_done: false, fail_msg: 'Удаление запрещено.'});
      }
    });
  });

  // file upload

  app.post('/upload/:path', function (req, res) {
    var files = [], ret_files = [],
      dir = prod_upload_dir + (req.param('path').length ? req.param('path') + '/' : '');

    // console.log(req.files, dir);

    for (var key in req.files) {
      if (req.files.hasOwnProperty(key)) {

        if (key == 'imgs') {
          if (req.files.imgs[0]) {
            files = (req.files[key].slice(0));
          } else {
            files.push(req.files[key]);
          }

          for (var i = 0; i < files.length; i++) {
            var sampleFile = files[i], counter = 0;

            function nameChecker(name) {
              if (fs.existsSync('.' + dir + name)) {
                counter++;
                nameChecker(slug((sampleFile.name).replace(/\.[a-z0-9]*$/, '') + '-' + counter) +
                  (sampleFile.name).replace(/.*(\.[a-z0-9]*$)/, '$1'));
              } else {

                sampleFile.mv('.' + dir + name, function (err) {
                  if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                  }
                });

                ret_files.push(dir + name);
              }
            }

            nameChecker(slug((sampleFile.name).replace(/\.[a-z0-9]*$/, '')) + (sampleFile.name).replace(/.*(\.[a-z0-9]*$)/, '$1'));

          }

          res.status(200).send({upload_done: !!ret_files.length, files: ret_files});

        }
      }
    }
  });

  // update favorites

  app.post('/fav_rm', isLoggedInPost, function (req, res) {
    if (!shared.isObjectID(req.body.id)) {
      return res.send({
        fav_added: false,
        items: req.client_info.fav,
        items_html: req.fav_html
      });
    }

    var fav_list = [];

    if (req.client_info) {
      if (req.client_info.fav) {
        fav_list = req.client_info.fav;
      }
    }

    var index = fav_list.indexOf('' + req.body.id);

    if (index > -1) {
      fav_list.splice(index, 1);

      favUpdate(fav_list, req, function (html) {
        res.send({
          fav_removed: true,
          items: req.client_info.fav,
          items_html: html
        });
      });
    } else {
      getFavList(req.client_info.fav, function (html) {
        // console.log(549, html);

        res.send({
          fav_removed: false,
          items: req.client_info.fav,
          items_html: html
        });
      });
    }
  });

  // update favorites
  app.post('/fav', isLoggedInPost, function (req, res) {

    // console.log('/fav', req.body.id);

    if (!shared.isObjectID(req.body.id)) {
      return res.send({
        fav_added: false,
        items: req.client_info.fav,
        items_html: req.fav_html
      });
    }

    var fav_list = [];

    if (req.client_info) {
      if (req.client_info.fav) {
        fav_list = req.client_info.fav;
      }
    }

    var index = fav_list.indexOf('' + req.body.id);

    if (index > -1) {
      fav_list.splice(index, 1);

      favUpdate(fav_list, req, function (html) {
        res.send({
          fav_removed: true,
          items: req.client_info.fav,
          items_html: html
        });
      });
    } else {
      fav_list.push('' + req.body.id);

      favUpdate(fav_list, req, function (html) {
        res.send({
          fav_added: true,
          items: req.client_info.fav,
          items_html: html
        });
      });
    }
  });

  // update favorites
  app.post('/fav_clear', isLoggedInPost, function (req, res) {

    favUpdate([], req, function (html) {
      res.send({
        fav_empty: true,
        items: req.client_info.fav,
        items_html: html
      });
    });
  });

  // GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback

  // app.get('/auth/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login']}));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

  // app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/login'}), function (req, res) {
  //     res.redirect('/');
  // });

  /*    app.get('/auth/google',
          passport.authenticate('google', {
                  scope: ['https://www.googleapis.com/auth/plus.login',
                      , 'https://www.googleapis.com/auth/plus.profile.emails.read']
              }
          ));
  
      app.get('/auth/google/callback',
          passport.authenticate('google', {
              successRedirect: '/auth/google/success',
              failureRedirect: '/auth/google/failure'
          }));*/


  // process the login form
  app.post('/login_lk', passport.authenticate('local-login', {
    successRedirect: '/login_success_lk', // redirect to the secure profile section
    failureRedirect: '/login_failed_lk', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  app.post('/login', restrict, passport.authenticate('local-login', {
    successRedirect: '/login_success', // redirect to the secure profile section
    failureRedirect: '/login_failed', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/login_failed', function (req, res) {
    var msg = req.flash('loginMessage'), ret = '';

    for (var k in msg) {
      if (msg.hasOwnProperty(k)) {
        ret += ',' + msg[k];
      }
    }

    console.log('login_failed', req.flash(), req.flash('loginMessage'));

    res.send({login_failed: true, fail_text: ret.slice(1)});

    // render the page and pass in any flash data if it exists
    // res.render('signup', { message: req.flash('signupMessage') });
  });

  app.get('/login_success', isLoggedIn, function (req, res) {
    var redirectTo = req.session.prevPage ? req.session.prevPage : '/';

    delete req.session.prevPage;

    // res.redirect(redirectTo);

    res.send({
      redirectTo: redirectTo,
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
    var msg = req.flash('signupMessage'), ret = '';

    for (var k in msg) {
      if (msg.hasOwnProperty(k)) {
        ret += ',' + msg[k];
      }
    }

    res.send({signup_failed: true, fail_text: ret.slice(1)});

    // render the page and pass in any flash data if it exists
    // res.render('signup', { message: req.flash('signupMessage') });
  });

  // =====================================
  // PROFILE SECTION =========================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/signup_success', function (req, res) {

    console.log(req.user);

    // var user_info = db.get().collection('products').findOne();

    var email = req.user.local.email;

    req.logout();

    db.get().collection('users').findOne({'local.email': email}, function (err, doc) {

      if (err) {
        // handle error 
        console.log(err);
        res.send('There was an error sending the email');
        return;
      }

      console.log('/signup_success', doc);

      app.mailer.send('email_confirm', {
        to: email, // REQUIRED. This can be a comma delimited string just like a normal email to field.  
        subject: 'Подтверждение e-mail на dreamsexpress', // REQUIRED. 
        confirmation_url: req.protocol + '://' + req.get('host') + '/activate/' + encrypt((doc._id).toString())
      }, function (err) {
        if (err) {
          // handle error 
          console.log(err);
          res.send('There was an error sending the email');
          return;
        }

        res.send({
          user_created: true,
          success_text: 'Подтвердите аккаунт. <br>Инструкции отправлены на e-mail: ' + email
        });

      });
    });

    // res.render('profile.ejs', {
    // 	user : req.user // get the user out of session and pass to template
    // });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.post('/logout', restrict, function (req, res) {
    req.logout();

    var redirectTo = req.session.prevPage ? req.session.prevPage : '/';

    delete req.session.prevPage;

    res.send({redirectTo: redirectTo, logout_done: true});
  });

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/profile',
    failureRedirect: '/'
  }));

};

// route middleware to make sure
function isLoggedInPost(req, res, next) {
  // console.log(req.user);
  // if user is authenticated in the session, carry on

  console.log('isLoggedInPost', req.isAuthenticated());

  if (req.isAuthenticated())
    return next();

  res.send({needAuth: true});

  // if they aren't redirect them to the home page
  // res.redirect('/login');
}

// route middleware to make sure
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/login');
}

// route middleware to make sure
function isAdmin(req, res, next) {
  // console.log('role', req.client_info, req.client_info.role);
  // if user is authenticated in the session, carry on
  if (req.client_info.role == 'admin' || req.client_info.role == 'admin_g')
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/lk');
}

function checkFav(id, list) {

  if (list.length) {
    return list.indexOf('' + id) > -1;
  }

  return false;
}

function colorRender(colors) {
  var ret = '', arr = colors.split(',');

  for (var i = 0; i < arr.length; i++) {
    var clr = (arr[i]).trim();

    if (shared.isHex(clr)) {
      ret += '<li><div class="prod_color" style="background:' + clr + ';"></div></li>';
    } else if (clr.length > 10) {
      ret += '<li><div class="prod_color"><img src="' + shared.checkSlash(clr) + '"></div></li>';
    }
  }

  return ret;
}

function colorList(colors) {
  var ret = '', arr = colors.split(',');

  for (var i = 0; i < arr.length; i++) {
    var clr = (arr[i]).trim();

    if (shared.isHex(clr)) {
      ret += '<li><label class="option_switch round"> <input class="inp_hidden" value="' + clr + '" type="radio" name="prod_color"/><span class="check_text" class="prod_color"><span class="simple_color" style="background:' + clr + ';"></span></span></label></li>';
    } else if (clr.length > 10) {
      ret += '<li><label class="option_switch round"> <input class="inp_hidden" value="' + clr + '" type="radio" name="prod_color"/><span class="check_text"><img src="' + shared.checkSlash(clr) + '"></span></label></li>';
    }
  }

  return ret;
}

function sizesList(sizes) {
  var ret = '', arr = sizes.split(',');

  for (var i = 0; i < arr.length; i++) {
    var size = (arr[i]).trim();

    ret += '<li><label class="option_switch"> <input class="inp_hidden" value="' + size + '" type="radio" name="prod_size"/><span class="check_text"><span>' + size + '</span></span></label></li>';

  }

  return ret;
}

function favItemsHtml(items) {
  var ret = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

// @formatter:off

        ret += 
            '<div class="favUnit fav_unit">' +
                '<div class="product_item">' +
                    '<a href="/product/' + item.url + '" class="product_img">' +
                        '<img src="' + shared.checkSlash(item.main_img) + '">' +
                    '</a>' +
                    '<div data-id="' + item._id + '" class="prod_rm_btn rmFavBtn"></div>' +
                    '<h3 class="product_caption">' + item.name + '</h3>' +
                    '<div class="product_price">' +
                        '<span class="new_price">' + shared.formatPrice(item.price) + '<span class="_cur"> грн.</span>' +
                        '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

// @formatter:on

  }

  return ret + '<div class="favUnitMarker"></div>';
}

function buildFotorama(hit, img, img2, gallery) {
  var ret = '<div class="fotorama" data-thumbwidth="60" data-thumbheight="60" data-height="340" data-nav="thumbs" data-thumbmargin="3">';

  ret += fotoramaSlide(hit, img);

  ret += fotoramaSlide(hit, img2);

  var imgs = gallery.split(',');

  for (var i = 0; i < imgs.length; i++) {
    ret += fotoramaSlide(hit, imgs[i]);
  }

  return ret + '</div>';
}

function fotoramaSlide(hit, img) {
  return img.length ? '<div class="prod_review_img product_img" data-thumb="' + shared.checkSlash(img) + '"><img src="' + shared.checkSlash(img) + '"/>' +
  (hit ? '<div class="product_hit">Хит продаж</div>' : '') + '</div>' : '';
}
