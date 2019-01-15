var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs")


function generateRandomString() {
  var id = Math.random().toString(36).substr(5);
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  //console.log(req.body.longURL)
  let newId = generateRandomString();
  urlDatabase.newId = req.body.longURL;
  let newLink = "/urls/" + newId;
  let templateVars = { shortURL: newId, longURL: req.body.longURL};
  res.render("urls_show", templateVars);

});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL)
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send('Not Found!')
  }
  else {
    let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
