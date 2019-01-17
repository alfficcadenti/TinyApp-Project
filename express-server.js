var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();

var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(express.static(__dirname + '/public'));


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "123123": {
    id: "123123",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "123456": {
    id: "123456",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.set("view engine", "ejs")


//Generic Utils Functions
function generateRandomString() {
  let id = Math.random().toString(36).substr(5);
  return id;
}


//GET Requests


app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { greeting: 'Register here:' };
  res.render("register", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
 };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
 };
  res.render("urls_new",templateVars);
});


app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send('Not Found!')
  }
  else {
    let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
  }
});


//POST Requests

app.post("/login", (req, res) => {
  let username = req.body.username;
  // set the cookie name username
  res.cookie("username", username);
  let link = "/urls";
  res.redirect(link);
});


app.post("/logout", (req, res) => {
  // clear the cookie name username
  res.clearCookie("username");
  let link = "/urls";
  res.redirect(link);
});

app.post("/register", (req, res) => {
  //generate random id
  let userId = generateRandomString();
  // generate the object for the user to append to userDB
  let user = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  }
  //update userDB appending the new user
  users[userId] = user;
  //set cookie user_id
  res.cookie("userId", userId);
  let link = "/urls";
  res.redirect(link);
  // redirect to /urls
  //let link = "/urls";
  //res.redirect(link);
});

app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  let newLink = "/urls/" + newId;
  let templateVars = { shortURL: newId, longURL: req.body.longURL};
  res.redirect(newLink);
});


app.post("/urls/:id/delete", (req, res) => {
  let shortUrl = req.params.id;
  delete urlDatabase[shortUrl];
  res.redirect("/urls");
});


app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  let link = "/urls/"+shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(link);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
