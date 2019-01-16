var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();

var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs")


function generateRandomString() {
  let id = Math.random().toString(36).substr(5);
  return id;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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
