var express = require("express");
var cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");

var app = express();

var PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(express.static(__dirname + '/public'));


const urlDatabase = {
  "b2xVn2": {
    id : "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: 123123
  },
  "9sm5xK": {
    id : "9sm5xK",
    longURL: "http://www.google.com",
    userId: 123456
  }
};

const users = {
  "123123": {
    id: "123123",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "123456": {
    id: "123456",
    email: "alf@gmail.com",
    password: "a"
  }
}

app.set("view engine", "ejs")



//////Generic Utils Functions
//---------------------------

//generate random id
function generateRandomString() {
  let id = Math.random().toString(36).substr(5);
  return id;
};

//userDBLookup
function userLookup(email) {
  for (let k in users) {
    if (users[k].email == email) {
      return users[k];
    }
  };
};


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

app.get("/login", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"]
 };
  res.render("login", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
 };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"]
  };
  //if not logged in return to login page
  if (req.cookies["user_id"] === undefined) {
    res.redirect("/login");
  }
  else {
    res.render("urls_new",templateVars);
  }

});


app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user_id: req.cookies["user_id"]};
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
  var emailInput = req.body.email;
  var passwordInput = req.body.password;
  //check user exist
  var user = userLookup(emailInput)
  //console.log(user)
  if (!user) {
    res.status(403).send('Email Not Found!')
  }
  else {
    //check password is correct
    if (user.password != passwordInput) {
      res.status(403).send('Password Incorrect!')
    }
    else {
      // set the cookie user_id
      res.cookie("user_id", user);
      let link = "/";
      res.redirect(link);
    }
  }
});


app.post("/logout", (req, res) => {
  // clear the cookie name email
  res.clearCookie("user_id");
  let link = "/urls";
  res.redirect(link);
});

app.post("/register", (req, res) => {
  //Registration Error Handling
  //Empty input => error
  if (req.body.email == '' || req.body.password == '') {
    res.status(400).send('Email or password is empty!')
  }
  // email already exists in DB
  else if (req.body.email != '') {
    for (let k in users) {
    if (users[k].email === req.body.email) {
      res.status(400).send('Email already used')
      }
    }

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
    res.cookie("user_id", user);
    //redirect
    let link = "/urls";
    res.redirect(link);
  };
});

app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  let userObj = req.cookies["user_id"]
  urlDatabase[newId] = {
    id: newId,
    longURL: req.body.longURL,
    userId: userObj.id
  }
  //console.log(urlDatabase[newId])
  let newLink = "/urls/" + newId;
  let templateVars = { shortURL: newId, longURL: req.body.longURL};
  res.redirect(newLink);
});


app.post("/urls/:id/delete", (req, res) => {

  let shortURL = req.params.id;
  //only URL owner can update
  console.log(req.cookies["user_id"].id,urlDatabase[shortURL].userId)
  if (req.cookies["user_id"].id != urlDatabase[shortURL].userId) {
    res.status(400).send('you are not the URL owner!')
  }
  else {
    delete urlDatabase[shortURL];
  res.redirect("/urls");
  }
});


app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  let link = "/urls/"+shortURL;
  let longURL = req.body.longURL;
  let userObj = req.cookies["user_id"]
  //only URL owner can update
  // if () {}
  urlDatabase[shortURL] = {
    id: shortURL,
    longURL: longURL,
    userId: userObj.id
  }
  res.redirect(link);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
