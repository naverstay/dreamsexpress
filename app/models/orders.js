var ObjectID = require('mongodb').ObjectID;
var db = require('../config/db');

exports.all = function (cb) {
  db.get().collection('orders').find({last_order: {$exists: false}}).toArray(function (err, docs) {
    // console.log(docs);
    cb(err, docs);
  });
};

exports.findById = function (id, cb) {
  db.get().collection('orders').findOne({_id: ObjectID(id)}, function (err, doc) {
    cb(err, doc);
  });
};

exports.findList = function (ids, cb) {
  console.log(ids);

  var obj_ids = ids.map(function (item) {
    return ObjectID(item);
  });

  db.get().collection('orders').find({_id: {$in: obj_ids}}).toArray(function (err, doc) {
    cb(err, doc);
  });
};

exports.findByName = function (name, cb) {
  db.get().collection('orders').find({name: name}).toArray(function (err, doc) {
    cb(err, doc);
  });
};

exports.getLastOrder = function (cb) {
  db.get().collection('orders').findOne({last_order: 'info'}, function (err, doc) {
    cb(err, doc);
  });
};

exports.filter = function (params, cb) {
  db.get().collection('orders').find(params).toArray(function (err, doc) {
    cb(err, doc);
  });
};

exports.create = function (order, cb) {
  db.get().collection('orders').insert(order, function (err, result) {
    cb(err, result);
  });
};

exports.update = function (id, newData, cb) {
  db.get().collection('orders').updateOne(
    {_id: ObjectID(id)},
    newData,
    function (err, result) {
      cb(err, result);
    }
  );
};

exports.delete = function (id, cb) {
  db.get().collection('orders').deleteOne(
    {_id: ObjectID(id)},
    function (err, result) {
      cb(err, result);
    }
  );
};
