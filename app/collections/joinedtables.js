var db = require('../config');
var User = require('../models/joinedtable');

var Entrys = new db.Collection();

Entrys.model = Entry;

module.exports = Entrys;
