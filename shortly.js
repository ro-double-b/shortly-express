var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var Entry = require('./app/models/joinedtable');

var app = express();

// var user;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

// app.get('/', 
// function(req, res) { 
//   console.log('user inputed = ', req.body.username);
//   console.log('user = ', user);

//   if (!user === req.body.username) {
//     res.redirect('/login');
//   } else {
//     res.render('index');
//   }
// });

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  var user = app.locals.user;
  var userid = new User({username: user}).fetch().then(function(user) {
    user.get('id');
  });

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }
  //check the website table first
  new Link({ url: uri }).fetch().then(function(found) {
    //if the website if found
    if (found) {
      var urlid = new Link({url: uri}).fetch().then(function(url) {
        url.get('id');
      });
      // query the join database for the userID
      new Entry({
        userid: userid
      }).fetch().then(function(tableItems) {
        console.log('tableItems', tableItems);
        // if that query has website foreign key
        if (tableItems.urlid === urlid) { 
          // do nothing
          return; 
        } else { // create new entry in join database with user/url foreign key
          Entry.create({
            userid: userid,
            urlid: urlid
          });
        }
      });  
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          // console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          // console.log('newlink', newLink);
          Entry.create({
            userid: userid,
            urlid: newLink.attributes.id
          });
          res.status(200).send(newLink);
        });
        //create entry in joined table
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
var bcrypt = require('bcrypt-nodejs');
var sessions = require('express-session');
app.use(sessions({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
//this is the sign up
app.post('/signup', function(request, response) {
  // check database to see if user exists
  var username = request.body.username;
  var password = request.body.password;


  new User({username: username}).fetch().then(function(found) {
    if (found) {
      // response.send(500, 'showAlert');
      response.redirect('/signup');
    } else {
      // Users.checkUsers(newUser.username, cb) {
      //   //console.log user name taken, choose a new one
      //   //give an error status code

      // }
      Users.create({
        username: username,
        password: password
      }).then(function(addedUser) {
        console.log('user.create', addedUser)
        request.session.user = username;
        app.locals.user = username;
        console.log('Session user is...', request.session.user);
        response.redirect('/');
      });
    }
  });
});

app.post('/login', function(request, response) {
  // alert('test test test')
  var username = request.body.username;
  var password = request.body.password;
  console.log('we are in login/POST: ', request.body)

  User.where('username', request.body.username).fetch().then(function(user) {
    if (username = user.attributes.username) {

      bcrypt.compare(password, user.attributes.password, function(err, data) {
        if (err) { throw err; }
        request.session.user = username;
        app.locals.user = username;
        console.log('Session user is...', request.session.user);
        response.redirect('/');
      });
    } else {
      response.render('/login');
    }
  }).catch(function(err) {
    console.log('this error: ', err);
    response.redirect('/login');
  });
});

app.get('/', function(req, res) {
  console.log('this is the user: ', app.locals.user); 
  if (req.session && req.session.user) {
    if (app.locals.user === req.session.user) {
      res.render('index');
    } else {
      req.session.reset();
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

