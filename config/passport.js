// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy   = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


var session = require('express-session')
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');

// load up the user model
var User       		= require('../app/models/user');
var Profile       	= require('../app/models/profile');
var Portfolio= require('../app/models/portfolio');
var Payment= require('../app/models/schemepayment');
var emailID,paymentKya;

var Zendesk = require('zendesk-node-api');

//var config=require('../config/auth.js');
// expose this function to our app using module.exports

/*
var pg = require('pg');
var conString = process.env.DATABASE_URL ||  "postgres://user1:12345@localhost:5432/investory";
var client = new pg.Client(conString);
*/


var pg = require('pg');

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
  user: 'postgres', //env var: PGUSER
  database: 'postgres', //env var: PGDATABASE
  password: '123', //env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, //env var: PGPORT
  max: -1, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients


var pg = require('pg');
var conString = "postgres://postgres:postgres@localhost:5432/investory";

var client = new pg.Client(conString);
client.connect();


module.exports = function(passport) {
    initZendDesk();

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and de-serialize users out of session

    // used to serialize the user for the session
    
    passport.serializeUser(function(user, done) {
     // console.log("serializeUser",user.userid);
        done(null, user.userid);
    });
    // used to deserialize the user
    passport.deserializeUser(function(userid, done) {
      //console.log("Hi deserialize");
    var query=client.query("SELECT * FROM users WHERE userid = $1 ",[userid], function(err, result){
            done(err, result.rows[0]);
        });
      });

    
  	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
var newUser= new User();
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
  
		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists

        
     var query=client.query("SELECT * FROM users WHERE email = $1",[email], function(err, result){
            {
                
                if (err) {
                    console.log("Local signup here",err);
                     return done(err);
                }
             if (result.rows.length>0)
               {
                  
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                }
            else
                {
                    
                    
                    newUser.password=req.body.password;
                    newUser.passwordhashed=password; //decrypt password
                    newUser.email = email;
                    newUser.name = req.body.username;
                    newUser.mobile=req.body.mnumber;
                    newUser.creation_date=new Date();
                    newUser.modified_date=new Date();
                   // console.log(name,password,mobile,creation_date,modified_date);
                    
                    var query=client.query("INSERT INTO users(email,password,mobile,name,created,modified,createdby) values($1,$2,$3,$4,$5,$6,$7) RETURNING userid",[newUser.email,newUser.passwordhashed,newUser.mobile,newUser.name,newUser.creation_date,newUser.modified_date,newUser.name],function(err, result) {
                    if(err)
                        console.log("cant create new user",err);
                        
                        console.log(result.rows[0].userid);
                        newUser.userid=result.rows[0].userid;
                    req.session.userEmail = email;
                    return done(null, newUser);
                     });
                    }
                    
               
            }
       
      
     });
    }));
    var user = new User();  
   
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
                                                
    function(req, email, password, done) { // callback with email and password from our form
req.session.payment =false;
        
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        var query= client.query("SELECT * FROM users where email=$1",[email], function(err, result)
            {
        // if there are any errors, return the error before anything else
            
            if (err)
                return done(err);
            
              
              if(result.rows.length==0)
              {
                console.log("No user found");
				return done(null, false, req.flash('loginMessage', 'No user found.'));

			  }
            else
              {
                    console.log(result.rows[0] + ' user is found login!');
                    
                    user.email= result.rows[0]['email'];
                    user.name= result.rows[0]['name'];
                    user.password = result.rows[0]['password'];
                    user.userid = result.rows[0]['userid'];
               
                }

             if (!(password==user.password)){
                 console.log(password,user.password);
                 
					console.log("Wrong password");
                 zendCreateTicket(email,'Login error, Wrong password');
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
			}
             
                
                zendCreateTicket(email,'Succesfully Logged in');

            req.session.userEmail = email;
           
            return done(null,result.rows[0]);
         
         	
          });
                
                    					 			
		
    }));
      var newUser=new User();
    passport.use(new FacebookStrategy({
    clientID: '1620502528254783',
    clientSecret: '724b87f6243da3bae2f2e5ddcc7e729d',
    callbackURL: 'http://localhost:3001/auth/facebook/callback',
         profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
        
  },
  function(accessToken, refreshToken, profile,done) {
   process.nextTick(function(){
             // User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
       var query=client.query("SELECT * FROM users where facebookid=$1",[profile.id],function(err,result){
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email

            if (result.rows.length>0) {
                email=result.rows[0]['email'];
                 zendCreateTicket(email,'Succesfully Logged in with facebook');
              return done(null, result.rows[0]);
                
            } 
           else 
           {
               // if there is no user with that email
                // create the user
               
                newUser.facebookid = profile.id;
                newUser.fbtoken = accessToken;
                 newUser.email =(profile.emails[0].value || '').toLowerCase();
                 newUser.name  = profile.name.givenName + ' ' + profile.name.familyName; 
                 
                    newUser.name=profile.name.givenName + ' ' + profile.name.familyName; ;
                    newUser.email = profile.emails[0].value;     
                    newUser.creation_date=new Date();
                    newUser.modified_date=new Date();
                
                
				// save the user
                var query=client.query("insert into users(email,name,created,modified,createdby,facebookid,fbtoken) values($1,$2,$3,$4,$5,$6,$7) RETURNING userid",[newUser.email,newUser.name,newUser.creation_date,newUser.modified_date,newUser.name,newUser.facebookid,newUser.fbtoken],function(err, result) {
                    if(err)
                        console.log("cant create new user",err);
                        
                       // console.log(result.rows[0].userid);
                        //newUser.userid=result.rows[0].userid;
                      newUser.userid=result.rows[0].userid;
                    zendCreateTicket(newUser.email,'Succesfully Logged in with facebook');
                     //req.session.userEmail = email;
                    return done(null, newUser);
                });
                
            }
            

        });

       
       
   });
  }
));
    let em;
    passport.use(new GoogleStrategy({

        clientID        : '87658927996-i8ovbtoljd8tir2e9pki4i8uagshb38c.apps.googleusercontent.com',
        clientSecret    : 'vUjKOhsz8f1_ovtzN4weOT7u',
        callbackURL     : 'http://localhost:3001/auth/google/callback',

    },
    function(token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

            // try to find the user based on their google id
          
             var query=client.query("SELECT * FROM users where googleid=$1",[profile.id],function(err,result){ 
            if (err)
                return done(err);
                
            // check to see if theres already a user with that email
            if (result.rows.length>0) {
              email=result.rows[0]['email'];
                 zendCreateTicket(email,'Succesfully Logged in with google+');  
              return done(null, result.rows[0]);
                
            }
                
           else {
                    // if the user isnt in our database, create a new user
                  

                    // set all of the relevant information
                    newUser.googleid    = profile.id;
                    newUser.g_token = token;
                    newUser.name  = profile.displayName;
                    newUser.email = profile.emails[0].value; // pull the first email
                    
                    
                    newUser.email = profile.emails[0].value;     
                    // save the user
               newUser.creation_date=new Date();
                    newUser.modified_date=new Date();
                 
                
               /*if(result.rows[0].email==newUser.email){
                   var query=client.query("UPDATE users SET name=$2,modified=$3,googleid=$4,g_token=5$ WHERE email=$1",[newUser.email,newUser.name,newUser.modified_date,newUser.googleid,newUser.g_token],function(err,result)
                     {
                       if(err)     
                        console.log("cant create new user",err);
                                          
                      newUser.userid=result.rows[0].userid;
                     //req.session.userEmail = email;
                    return done(null, newUser);
                
                   });
                  }
               else{
				*/// save the user
                var query=client.query("insert into users(email,name,created,modified,createdby,googleid,g_token) values($1,$2,$3,$4,$5,$6,$7) RETURNING userid",[newUser.email,newUser.name,newUser.creation_date,newUser.modified_date,newUser.name,newUser.googleid,newUser.g_token],
                    function(err, result) {
                    if(err)     
                        console.log("cant create new user",err);
                        
                       // console.log(result.rows[0].userid);
                        //newUser.userid=result.rows[0].userid;
                      newUser.userid=result.rows[0].userid;
                     //req.session.userEmail = email;
                    email=result.rows[0]['email'];
                 zendCreateTicket(email,'Succesfully Logged in with google+');
              
                    return done(null, newUser);
                });
               }
                    
              //  }
             });
            });
    }

    ));

    
var zendesk;
function initZendDesk(){

zendesk = new Zendesk({
 url: 'https://plasticwaterlabs.zendesk.com', // https://example.zendesk.com
 email: 'sohan@plasticwaterlabs.com', // me@example.com
 token: 'KZ0CSdA9FnAqrZGpINqLiJcct70Do6z34iJDrnHW' // hfkUny3vgHCcV3UfuqMFZWDrLKms4z3W2f6ftjPT
});

}
function zendCreateTicket(subjet, body){
zendesk.tickets.create({

   subject: subjet,
   comment: {
     body: body
   }
 }).then(function(result){
   //console.log(result);
 });

}
    
};
