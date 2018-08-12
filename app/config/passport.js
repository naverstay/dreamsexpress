// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// var GoogleStrategy = require('passport-google-oauth2').Strategy;

// load up the user model
var User = require('../models/user');

// load the auth variables
var configAuth = require('./auth');

var ObjectID = require('mongodb').ObjectID;
var client = require('../models/clients');

// expose this function to our app using module.exports
module.exports = function (passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  /*
      passport.use(new FacebookStrategy({
              clientID: settings.server.facebook.clientId,
              clientSecret: settings.server.facebook.clientSecret,
              callbackURL: settings.server.facebook.oAuthRedirect1,
              profileFields: ['displayName', 'email'],
              passReqToCallback: true
          },
          //done method is the passport.authenticate callback
          async((req, accessToken, refreshToken, profile, done), function () {
              try {
                  var r = await
                  myapi.authenticate(accessToken, profile);
                  if (!r.authorized) {
                      done('unauthorized'); //error (calls the passport.authenticate callback)
                  } else {
                      done(null, { //no error (calls the passport.authenticate callback)
                          token: r.token,
                          fbid: profile.id,
                          fb_access_token: accessToken,
                          profile: profile
                      });
                  }
              }
              catch (e) {
                  logger.error(e);
              }
          })));
      */


  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================

  passport.use(new GoogleStrategy({
    clientID: configAuth.googleAuth.clientID,
    clientSecret: configAuth.googleAuth.clientSecret,
    callbackURL: configAuth.googleAuth.callbackURL
  }, function (token, refreshToken, profile, done) {

    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function () {

      // try to find the user based on their google id
      User.findOne({'google.id': profile.id}, function (err, user) {
        if (err)
          return done(err);

        if (user) {

          // if a user is found, log them in
          return done(null, user);
        } else {
          // if the user isnt in our database, create a new user
          var newUser = new User();

          // set all of the relevant information
          newUser.google.id = profile.id;
          newUser.google.token = token;
          newUser.google.name = profile.displayName;
          newUser.google.email = profile.emails[0].value; // pull the first email

          // save the user
          newUser.save(function (err) {
            if (err)
              throw err;
            return done(null, newUser);
          });
        }
      });
    });
  }));

  /*    passport.use(new GoogleStrategy({
              clientID: configAuth.googleAuth.clientID,
              clientSecret: configAuth.googleAuth.clientSecret,
              callbackURL: configAuth.googleAuth.callbackURL,
              passReqToCallback: true
          },
          function (request, accessToken, refreshToken, profile, done) {
              User.findOrCreate({googleId: profile.id}, function (err, user) {
                  return done(err, user);
              });
          }
      ));*/


  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  }, function (req, email, password, done) {

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({'local.email': email}, function (err, user) {
      // if there are any errors, return the error
      if (err)
        return done(err);

      // check to see if theres already a user with that email
      if (user) {
        return done(null, false, req.flash('signupMessage', 'Email занят'));
      } else {

        // if there is no user with that email
        // create the user
        var newUser = new User();

        // set the user's local credentials
        newUser.local.email = email;
        newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model

        // save the user
        newUser.save(function (err) {
          if (err)
            throw err;
          return done(null, newUser);
        });
      }
    });

  }));

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  }, function (req, email, password, done) { // callback with email and password from our form

    console.log(req, email);

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({'local.email': email}, function (err, user) {
      // if there are any errors, return the error before anything else
      if (err)
        return done(err);

      // if no user is found, return the message
      if (!user)
        return done(null, false, req.flash('loginMessage', 'Пользователь не найден')); // req.flash is the way to set flashdata using connect-flash

      // if the user is found but the password is wrong
      if (!user.validPassword(password))
        return done(null, false, req.flash('loginMessage', 'Пароль не подходит')); // create the loginMessage and save it to session as flashdata

      client.filter({_id: ObjectID(user._id)}, function (err, results) {
        var customer = results[0];

        if (!results.length || !customer.role || customer.role == '') {
          return done(null, false, req.flash('loginMessage', 'Требуется подтверждение e-mail'));
        }

        // all is well, return successful user
        return done(null, user);
      });
    });
  }));
};
