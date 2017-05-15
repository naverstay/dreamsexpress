var ObjectID = require('mongodb').ObjectID;
var db = require('../config/db');

exports.all = function (cb) {
    db.get().collection('clients').find().toArray(function (err, docs) {
        console.log(docs);
        cb(err, docs);
    });
};

exports.findById = function (id, cb) {
    db.get().collection('clients').findOne({_id: ObjectID(id)}, function (err, doc) {
        cb(err, doc);
    });
};

exports.findByName = function (name, cb) {
    db.get().collection('clients').find({name: name}, function (err, doc) {
        cb(err, doc);
    });
};

// exports.filter = function (params, cb) {
//     console.log(params, {name: params.name});
//
//     db.get().collection('clients').find({name: params.name}, function (err, doc) {
//         cb(err, doc);
//     });
// };

exports.filter = function (params, cb) {
    db.get().collection('clients').find(params).toArray(function (err, doc) {
        cb(err, doc);
    });
};

exports.create = function (product, cb) {
    db.get().collection('clients').insert(product, function (err, result) {
        cb(err, result);
    });
};

exports.update = function (id, newData, cb) {
    // var client;

    // db.get().collection('clients').findOne({_id: ObjectID(id)}, function (err, doc) {
    //     client = doc;
    // }); 
    // 
    // updateOne

    db.get().collection('clients').save(
        {
            _id: ObjectID(id),
            first_name: newData.first_name,
            last_name: newData.last_name,
            phone: newData.phone,
            address: newData.address,
            role: newData.role || '',
            fav: newData.fav
        }, function (err, result) {
            cb(err, result);
        }
    );

};

exports.delete = function (id, cb) {
    db.get().collection('clients').deleteOne(
        {_id: ObjectID(id)},
        function (err, result) {
            cb(err, result);
        }
    );
};
