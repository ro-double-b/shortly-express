var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, attrs, options) {
    //should add to database
    return new Promise(function(resolve, reject) {
      //why do we need to wrap gensalt around hash?
      //should passing in 10 as the salt work?
      bcrypt.genSalt(10, function(err, salt) {
        var salty = salt;
        bcrypt.hash(model.attributes.password, salt, null, function(err, hash) {
          if (err) { reject(err); }
          model.set('password', hash);
          model.set('salt', salty);
          resolve(hash);
        });
      });
    });
  },
 // check password which returns true or false
  checkUser: function(salt, storedPassword, password, callback) {
    var pw = storedPassword;
    bcrypt.hash(password, salt, null, function(err, hash) {
      console.log('inside checkUser!');
      bcrypt.compare(password, pw, callback);
    });
    // console.log('inside checkUser');
    // this.hashPassword()
    // compare password, hash (db), and function(err, res)
    // User.where('username', username).fetch().then(function(user) {
    //   console.log('inside user.where', user.salt);
    //   callback(err, user);
    // });
    //start by finding the username insde the database
      //if it is found take the salt and the password
        //apply the salt to the supplied password
          //if it matches, let the user in
          //else if password doesnt match or username doesnt match, notify user
  // bcrypt.compare(password, hash, callback);
    //for argument inputs, takes in a username and a cb
    //go into the database
    //and check if the username already exists
  }
});

module.exports = User;