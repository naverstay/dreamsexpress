var ObjectID = require('mongodb').ObjectID;
var db = require('../db');

exports.all = function (cb) {
    db.get().collection('products').find().toArray(function (err, docs) {
        console.log(docs);
        cb(err, docs);
    });
};

exports.findById = function (id, cb) {
    db.get().collection('products').findOne({_id: ObjectID(id)}, function (err, doc) {
        cb(err, doc);
    });
};

exports.findByName = function (name, cb) {
    db.get().collection('products').find({name: name}, function (err, doc) {
        cb(err, doc);
    });
};

exports.filter = function (params, cb) {
    console.log(params, {name: params.name});

    db.get().collection('products').find({name: params.name}, function (err, doc) {
        cb(err, doc);
    });
};

exports.create = function (product, cb) {
    db.get().collection('products').insert(product, function (err, result) {
        cb(err, result);
    });
};

exports.update = function (id, newData, cb) {
    db.get().collection('products').updateOne(
        {_id: ObjectID(id)},
        newData,
        function (err, result) {
            cb(err, result);
        }
    );
};

exports.delete = function (id, cb) {
    db.get().collection('products').deleteOne(
        {_id: ObjectID(id)},
        function (err, result) {
            cb(err, result);
        }
    );
};
