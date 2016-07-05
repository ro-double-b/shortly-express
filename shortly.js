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

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
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
  var newUser = {
    username: request.body.username,
    password: request.body.password
  };

  new User(newUser).fetch().then(function(found) {
    if (found) {
      return 'user already in database';
    } else {
      // Users.checkUsers(newUser.username, cb) {
      //   //console.log user name taken, choose a new one
      //   //give an error status code

      // }
      Users.create({
        username: newUser.username,
        password: newUser.password
      }).then(function(addedUser) {
        // console.log('New user created....' + addedUser);
        // response.status(200).send(addedUser);
        response.redirect('/');
      });
    // if user does not exist first check if in database
    // if not create a new instance on New User
      
    }
  });
});

// var auth = function(req, res, next) {
//   console.log(req.session, ' & ', req.session.user);
//   if (req.session && req.session.user === 'Phillip') {
//     return next();
//   } else {
//     return res.sendStatus(401);
//   }
// };

app.post('/login', function(request, response) {
  // alert('test test test')
  var username = request.body.username;
  var password = request.body.password;

  // new User({username: username}).fetch().then(function(user) {
  //   console.log(user);
  // });


  User.where('username', request.body.username).fetch().then(function(user) {
    if (username = user.attributes.username) {

      bcrypt.compare(password, user.attributes.password, function(err, data) {
        if (err) { throw err; }
        request.session.user = username;
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

  //     User.checkUsers(user.attributes.salt, user.attributes.password, password, function(err, data) {
  //       if (err) { throw err; }
  //       request.session.user = username;
  //       console.log('Session user is...', request.session.user);
  //       response.redirect('/');
  //     });
  //   } else {
  //     response.redirect('/login');
  //   }
  // }).catch(function(err) {
  //   console.log(err);
  // });


  // if (request.body.username === 'Phillip' && request.body.password === 'Phillip') {
  //   console.log('HIIIIIIIII');
  //   request.session.user = 'Phillip';
  //   console.log(request.session.user);
  //   // user = request.session.user;
  //   // response.send('login success!');
  //   response.redirect('/');
  // } else {
  //   response.redirect('/login');
  // }

app.get('/', function(req, res) { 
  if (req.session && req.session.user) {
    if (!req.body.user === req.session.user) {
      req.session.reset();
      res.redirect('/login');
    } else {
      res.locals.user = req.body.user;
      res.render('index');
    }
  } else {
    res.redirect('/login');
  }
});
  // console.log('user inputed = ', req.body.username);
  // console.log('user = ', user);
  // res.send();
  // if (!user === req.body.username) {
  //   res.redirect('/login');
  // } else {
  //   res.render('index');
  // }
//   new User({username: username}).fetch().then(function(user) {
//     console.log(user.salt);
//   });
// });
//     User.checkUsers(username, function(err, res) {
//     if (err) { throw err; }
//     console.log('final');
//     console.log(res);
//   });
//   util.checkUsers(password, function(err, data) {
//     if (err) { throw err; }
//     if (!data) {

//     }
//

//this is the login in page
// app.post('/login', function(request, response) {
//   var username = request.body.username;
//   var password = request.body.password;

//   if (username === 'Phillip' && password === 'Phillip') {
//     response.redirect('/');
//   } else {
//     response.redirect('/login');
//   }


// });

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
