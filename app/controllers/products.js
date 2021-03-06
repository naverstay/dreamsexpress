var shared = require('../shared.js');

var Products = require('../models/products');
var slug = require('slug');
var fs = require('fs');

exports.all = function (params, cb) {
  Products.all(function (err, docs) {
    if (err) {
      // console.log(err);
      return res.sendStatus(500);
    }
    // console.log(docs);

    return docs;
  });
};

exports.findById = function (id, cb) {
  Products.findById(shared.isObjectID(id) ? id : shared.getObjectID(id), function (err, doc) {
    if (err) {
      // console.log(err);
      return cb.sendStatus(500);
    }

    if (typeof cb == 'function') {
      cb(doc);
    } else {
      return doc;
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

   //console.log(req.body);

  if (req.body._id && shared.isObjectID(req.body._id)) {

    // Products.filter({name: req.body.product_name}, function (err, results) {
    //     if (err) {
    //         console.log(err);
    //         return res.sendStatus(500);
    //     }
    //
    //     if (results.length) {
    //         res.send({update_failed: true, fail_text : 'Имя <b>' + req.body.product_name + '</b> уже занято.'});
    //
    //     } else {


    Products.findById(shared.getObjectID(req.body._id), function (err, doc) {
        //console.log('doc', doc);

      var product = {
        name: req.body.product_name,
        url: doc['url'],
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

      Products.update(shared.getObjectID(req.body._id), product, function (err, result) {
        if (err) {
          console.log(err);
          return res.sendStatus(500);
        }

        if (result.modifiedCount) res.send({'redirectTo': true});
      });
    });

    // }

    // });

  } else {

    var new_url = slug(req.body.product_name);

    function urlMaker(new_url, counter) {
      // console.log(new_url);

      Products.filter({url: new_url + (counter > 1 ? '-' + counter : '')}, function (err, results) {
        if (results.length) {
          urlMaker(new_url, counter + 1);
        } else {
          var product = {
            name: req.body.product_name,
            url: new_url + (counter > 1 ? '-' + counter : ''),
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
            var ret = {};
            if (err) {
              console.log(err);
              return res.sendStatus(500);
            }
// @formatter:off
                    if (result.insertedCount) {
                        var prod_title =
                                '<div class="order_row orderRow">' +
                                    '<div class="order_expand_btn orderExpandBtn"></div><div class="order_cell col_1">' +
                                        '<a class="order_img" href="' + new_url + (counter > 1 ? '-' + counter : '') + '" target="_blank">' +
                                            '<img src="' + product.main_img + '">' +
                                        '</a>' +
                                        '<span class="cell_val">' + product.name + '</span>' +
                                    '</div>' +
                                    '<div class="order_cell col_2">' +
                                        '<span class="cell_val">' +
                                            '<span class="prod_f_icon ' + (product.in_stock ? 'in_stock' : 'expected') + '"></span>' +
                                            '<span>' + shared.formatPrice(product.price) + ' грн.</span>' +
                                            (product.old_price? ', старая цена ' + shared.formatPrice(product.old_price) + ' грн.' : '') +
                                        '</span>' +
                                    '</div>' +
                                    '<div class="order_cell col_3">' +
                                        '<span class="cell_val">' +
                                            '<span class="prod_f_icon ' + (product.is_hit ? 'in_stock' : 'canceled') + '"></span>' +
                                            '<span>' + product.category + '</span>' +
                                        '</span>' +
                                    '</div>' +
                                    '<div class="order_cell col_4">' +
                                        '<span class="cell_val fw_500 _link_controls">' +
                                            '<a class="black_link" href="/edit/' + new_url + (counter > 1 ? '-' + counter : '') + '" target="_blank">Редактировать</a><a class="black_link rmProdBtn" href="#" data-id="' + new_url + '" data-name="' + product.name + '">Удалить</a>' +
                                        '</span>' +
                                    '</div>' +
                                '</div>',

                            prod_info =
                                '<div class="orderExpandRow" style="display:none;">' +
                                    '<div class="order_row collapsed">' +
                                        '<div class="order_cell col_1_w">' +
                                            '<div class="order_product">' +
                                                previewBuilder(product.hover_img, product.img_list, new_url + (counter > 1 ? '-' + counter : '')) +
                                            '</div>' +
                                            '<p>' + product.info + '</p>' +
                                            '<p>' + product.description + '</p>' +
                                        '</div>' +
                                        '<div class="order_cell col_2_w">' +
                                            '<div class="cell_val">' +
                                                '<ul class="prod_colors">' +
                                                    colorBuilder(product.colors) +
                                                '</ul>' +
                                                '<p> Пол: <span>' + product.gender + '</span></p>' +
                                                '<p> Сезон: <span>' + product.season + '</span></p>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="order_cell col_3_w">' +
                                            '<div class="cell_val">' +
                                                '<p>Размеры: ' + product.sizes + '</p>' +
                                                '<p>' + (product.adult ? 'Для взрослых' : 'Для детей') +  '</p><p>Артикул: ' + product.product_code + '</p>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>';


                        ret['product_added'] = true;
                        ret['prod_title'] = prod_title;
                        ret['prod_info'] = prod_info;
                    } else {
                        ret['product_added'] = false;
                    }
// @formatter:on
            res.send(ret);
          });
        }
      });
    }

    urlMaker(new_url, 1);
  }
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
  console.log(req.params);

  var filter = [{url: req.params.id}];

  if (shared.isObjectID(req.params.id)) {
    filter.push({_id: shared.getObjectID('' + req.params.id)});
  }

  Products.filter({$or: filter}, function (err, results) {
    var product = results[0];

    if (err){
      return res.sendStatus(500);
    }

    console.log(results, product._id);

    if (results.length) {
      Products.delete(
        results[0]._id,
        function (err, result) {
          if (err) {
            console.log(err);
            return res.sendStatus(500);
          }

          shared.cleanUp(product.main_img);

          shared.cleanUp(product.hover_img);

          var img_arr = product.img_list.split(',');

          for (var i = 0; i < img_arr.length; i++) {
            shared.cleanUp(img_arr[i]);
          }

          var colors = product.colors.split(',');

          for (var i = 0; i < colors.length; i++) {
            var clr = colors[i];

            if (!shared.isHex(clr)) {
              shared.cleanUp(clr);
            }
          }

          res.status(200).send({remove_done: true});
        }
      );
    } else {
      res.status(200).send({remove_failed: true});
    }
  });
};

function previewBuilder(hover_img, img_arr, href) {
  var ret = previewLink(hover_img, href), arr = img_arr.split(',');

  for (var i = 0; i < arr.length; i++) {
    ret += previewLink(arr[i], href);
  }

  return ret;
}

function previewLink(img, url) {
  return (img && img.length ?
  '<a class="order_img" href="/product/' + url + '" target="_blank">' +
  '<img src="' + img + '">' +
  '</a>' : '');
}

function colorBuilder(colors) {
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
