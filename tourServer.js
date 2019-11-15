const express = require('express');		// for express stuff
var app = express();
app.use(express.static('public'));
const nunjucks = require('nunjucks');		// for nunjucks stuff
var urlencodedParser = express.urlencoded({extended: true});
const DataStore = require('nedb');		// for nedb stuff
const bcrypt = require('bcryptjs');		// for bycrypt stuff

nunjucks.configure('templates', {
    autoescape: true,
    express: app
});

const session = require('express-session');		// for express-session stuff
const cookieName = "wi9937";
app.use(session({
	secret: 'This is my secret! Do you understand?',
	resave: false,
	saveUninitialized: false,
	name: cookieName // Sets the name of the cookie used by the session middleware
}));


// This initializes session state
const setUpSessionMiddleware = function (req, res, next) {
  // We can attach any state/info we like to the session JS object
  // Below we add a user property.
  if (!req.session.user) { // Check for state or initialize it
    req.session.user = {role: "guest", firstName: "", lastName: ""};
  }
  next();
};
app.use(setUpSessionMiddleware); // Put it to use!

// Use this middleware to restrict paths to only logged in users
const checkLoggedInMiddleware = function (req, res, next) {
	if (req.session.user.role != "customer") {
		res.render("Forbidden.njk", {user: req.session.user});
	} else {
		next();
	}
};

// use this middleware to restrict paths to only the admin
const checkAdminMiddleware = function (req, res, next) {
	if (req.session.user.role != "admin") {
		res.render("Forbidden.njk", {user: req.session.user});
	} else {
		next();
	}
};

/* webpage - permission: ALL */
app.get('/login', function (req, res) {
	res.render('login.njk', {user: req.session.user});
});

/* webpage - permission: ALL */
app.post('/loginStatus', express.urlencoded({extended:true}), function (req, res) {
	console.log(req.body);		// print what the user entered from the login page
	const dbUsers = new DataStore({filename: __dirname + '/usersDB', autoload: true});		// loading in our already created database
	let email = req.body.email;
	let password = req.body.password;
	
	// Find user
	dbUsers.find({"email": email}, function(err, docs) {
		if (err) {
			console.log("something is wrong");
		} else {
			console.log("We found " + docs.length + " email that matches");
			if(docs.length == 0) { 
				res.render('loginError.njk');
				return;
			}
			
			let verified = bcrypt.compareSync(password, docs[0]['passHash']);
			console.log(verified);
			if (!verified) {
				// Upgrade in priveledge, should generate new session id
				// Save old session information if any, create a new session
				let oldInfo = req.session.user;
				req.session.regenerate(function (err) {
					if (err) {
						console.log(err);
					}
					if(docs[0]['role'] == "admin") {		// give them admin role
						req.session.user = Object.assign(oldInfo, docs, {
							role: "admin",
							firstName: docs[0]['firstName'],
							lastName: docs[0]['lastName']
						});
					} else { 		// give them customer role
						req.session.user = Object.assign(oldInfo, docs, {
							role: "customer",
							firstName: docs[0]['firstName'],
							lastName: docs[0]['lastName']
						});
					}
					res.render("welcome.njk", {user: docs[0]});
				});
			} else {
				res.render("loginError.njk");
			}
		}
	});
});

/* webpage - permission: ALL */
app.get('/', function (req, res) {
    res.render('index.njk', {user: req.session.user});
});

/* webpage - permission: ALL */
app.get('/about', function(req, res){
    res.render('about.njk', {user: req.session.user});
});

/* webpage - permission: ALL */
app.get('/newsLetter', function(req, res){
    res.render('newsLetter.njk', {user: req.session.user});
});

let newLetterSubs = []; // array to hold subscriber info
// This array would be replaced by database

/* webpage - permission: ALL */
app.get("/newsSignup", function(req, res){
    newLetterSubs.push(req.query);
    console.log(`New subscribers: ${JSON.stringify(newLetterSubs)}`);
    res.render("newsThanks.njk", req.query, {user: req.session.user});
});

/* webpage - permission: ALL */
app.get('/tours', function(req, res){
	const dbTours = new DataStore({filename: __dirname + '/toursDB', autoload: true});		// loading in our already created database
	var minecraftTours = [];
	
	dbTours.find({"name": /.../}, function(err, docs) {		// return all items in the database
		if (err) {
			console.log("something is wrong");
		} else {
			console.log("We found " + docs.length + " tours");
			for(let d of docs) {
				console.log(`Name: ${d.name}, Date: ${d.date}`);
				minecraftTours.push({"name": `${d.name}`, "date": `${d.date}`})		// append database items to variable
			}
			res.render('tours.njk', {tours: minecraftTours, user: req.session.user});		// had to change the tours.njk variable for the for-loop, compared to hw8
		}
	});
});

/* webpage - permission: ADMIN */
app.get('/addTours', checkAdminMiddleware, function(req, res){
	let info = req.query;
    res.render('addTours.njk', {info: info, user: req.session.user});
});

// Respond to post request from form page.
app.post('/addedTour', checkAdminMiddleware, urlencodedParser, function(req, res) {
    console.log(req.body);
    res.send(createHtmlMessage(req.body));
});

function createHtmlMessage(info) {
    let begining =
`<!DOCTYPE html>
<html lang="en">
    <head><meta charset="utf-8">
        <title>Tour Added</title>
        <link rel="stylesheet" href="tour.css">
    </head>
	<ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About the Tour</a></li>
        <li><a href="/customerLogin">Customer Login</a></li>
        <li><a href="/newsLetter">NewsLetter</a></li>
        <li><a href="/tours">Tours</a></li>
        <li><a href="/addTours">Add Tours</a></li>
    </ul>
	<body><div class="message">`,
        end = `</div></body></html>`;
    let content = `<h3>Added the Tour: <em>${info.tourName} ${info.tourDate}</em></h3>`;
	
	var newTour = [];
	newTour.push({"name": `${info.tourName}`, "date": `${info.tourDate}`});
	dbTour.insert(newTour, function(err, newDocs) {		// insert a user defined new tour into the database WAS INITIALLY db SOMEHOW???
		if(err) {
			console.log("Something went wrong when writing");
			console.log(err);
		} else { console.log("Added a new tour"); }
	});
    return begining + content + end;
}

let host = '127.15.59.37';
let port = '2323';

app.listen(port, host, function () {
    console.log("tourServer via Templates listening on IPv4: " + host + ":" + port);
});