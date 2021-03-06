var router = require ('express').Router();
var mongoose = require ('mongoose');
var es6Promise = require ('es6-promise').Promise;

var ChatSchema = require ('../schemas/ChatSchema');
var config = require ('../data/config');

var Chat = mongoose.model ('chats', ChatSchema);

module.exports = (socket) => {
    router.get ('/', (req, res) => {
        if (req.session.user) {
            mongoose.Promise = es6Promise;
            mongoose.connect (config.host, config.db);
            Chat.find ({}, (err, data) => {
                if (err) res.send ({status: 'error', message: err});
                else if (data && data.length > 0) {
                    res.send (data);
                } else
                    res.send ({status: 'alert', message: 'no chats'});
                
                mongoose.disconnect ();
            });
        } else res.send ({status: 'error', message: 'Login first'});
    });

    router.get ('/active', (req, res) => {
        
    });

    router.get ('/get/:id', (req, res) => {
        if (req.session.user) {
            mongoose.Promise = es6Promise;
            mongoose.connect (config.host, config.db);

            Chat.findOne ({_id: req.params.id}, (err, data) => {
                if (err) res.send ({status: 'error', message: err});
                else if (data)
                    res.send ({status: 'success', message: data});
                else
                    res.send ({status: 'error', message: 'no data found'});
                
                mongoose.disconnect ();
            });
        } else res.send ({status: 'error', message: 'Login first'});
    });

    router.post ('/message', (req, res) => {
        if (req.session.user) {
            if (req.body.message) {
                mongoose.Promise = es6Promise;
                mongoose.connect (config.host, config.db);
                var message = new Chat({
                    _user: req.session.user.id,
                    message: req.body.message,
                    time: new Date().getTime()
                });

                message.save().then ((data) => {

                    // send the populated dadta
                    Chat.findOne ({_id: data._id}).populate ('_user', '_id username machine'). exec ((err, doc) => {
                        if (err) res.send ({status: 'error', message: err});
                        else if (doc) {
                            res.send ({status: 'success', data: doc});
                            socket.emit ('new-chat', doc);
                        }
                        else res.send ({status:'error', message: 'No data'});

                        mongoose.disconnect ();
                    });
                });
            } else
                res.send ({status:'error', message: 'cannot send empty message'});
        } else
            res.send ({status: 'error', message: 'login first'});
    });

    // get all messages
    router.get ('/populate', (req, res) => {
        if (req.session.user) {
            mongoose.Promise = es6Promise;
            mongoose.connect (config.host, config.db);
            Chat.find({}).populate ("_user", "_id username machine").exec ((err, doc) => {
                if (err) res.send ({status:'error', message: err});
                else if (doc) res.send ({status: 'success', data: doc});
                else res.send ({status: 'error', message: 'nothing found'});

                mongoose.disconnect ();
            });
        } else res.send ({status: 'error', message: 'Login first'});
    });

    // route to populate a single message.
    router.get ('/populate_single/:id', (req, res) => {
        if (req.session.user) {
            if (req.params.id) {
                mongoose.Promise = es6Promise;
                mongoose.connect (config.host, config.db);

                Chat.findOne({_id: req.params.id}).populate ("_user", "_id username machine").exec ((err, doc) => {
                    if (err) res.send ({status: 'error', message: err});
                    else if (doc) res.send ({status: 'success',data: doc});
                    else res.send ({status: 'error', message: 'No data'});
                    
                    mongoose.disconnect ();
                    console.log ('disconnected from database for '+ req.session.username);
                });
            } else {
                res.send ({status: 'error', message: 'require id'});
            }
        } else res.send ({status: 'error', message: 'Login first'});
    });

    return router;
}