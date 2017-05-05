var Clients = require('../models/clients');

exports.all = function (req, res) {
    Clients.all(function (err, docs) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        console.log(docs);
        res.send(docs);
    });
};

exports.findById = function (req, res) {
    Clients.findById(req.params.id, function (err, doc) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    });
};

exports.findByName = function (req, res) {
    console.log('req.session.passport.user', req, req.session.passport.user);

    Clients.findByName(req.params.name, function (err, doc) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    });
};


exports.filter = function (params, cb) {
    Clients.filter(params, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        cb(err, result);
    });
};

exports.create = function (req, res) {
    // console.log(req.body);

    var client = {
        first_name: req.body.client_first_name,
        last_name: req.body.client_last_name,
        phone: req.body.client_phone,
        address: req.body.client_address,
        role: ''
    };

    Clients.create(client, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(result);
    });
};

// exports.filter = function (req, res) {
//     Clients.filter(req, function (err, result) {
//         if (err) {
//             console.log(err);
//             return res.sendStatus(500);
//         }
//         res.send(result);
//     });
// };

exports.update = function (req, res) {
    console.log('req.session.passport.user update', req, req.session.passport.user);
    
    Clients.update(
        req.params.id, {
            first_name: req.body.client_first_name,
            last_name: req.body.client_last_name,
            phone: req.body.client_phone,
            address: req.body.client_address
        }, function (err, result) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            res.sendStatus(200);
        }
    );
};

exports.delete = function (req, res) {
    Clients.delete(
        req.params.id,
        function (err, result) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            res.sendStatus(200);
        }
    );
};
