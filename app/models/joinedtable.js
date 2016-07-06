var db = require('../config');
var crypto = require('crypto');
var User = require('./user');
var Link = require('./link');

var Entry = db.Model.extend({
  tableName: 'joined_table',
  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {

  //   });
  // }
  userid: function() {
    return this.hasMany(User, 'id');
  },
  urlid: function() {
    return this.hasMany(Link, 'id');
  },
  initialize: function() {
    console.log('inside entry');
    this.on('creating', function(model, attrs, options) {
      console.log('this is the attributes....', attrs);
      model.set(attrs);
    });
  }
});

module.exports = Entry;

//we need to create a model that can be referenced in shortly.js
//that will create new instances of entry, and 
//through this instance, put the rows into the database

//in addition, should be able to write query functions in 
//shortly and insdie of linksView (which is responsible
//for showing the links for the specific user)