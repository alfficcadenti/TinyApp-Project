const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

var app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(methodOverride('_method'))



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(cookieSession({
  name: 'session',
  keys: ['key 1'],
  maxAge: 30 * 24 * 60 * 60 * 1000 // 24 hours
}))


/// DATABASES
//  ---------
const urlDatabase = {
  "b2xVn2": {
    id : "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "123123"
  },
  "9sm5xK": {
    id : "9sm5xK",
    longURL: "http://www.google.com",
    userId: "123456"
  }
};

const users = {
    userId : { id: "123456",
    email: "a@a.it",
    password: ""
    },
};

const urlVisits = {
   1: {
    timestamp : "1547933494441",
    longURL: "http://www.lighthouselabs.ca",
    shortURL: "b2xVn2",
    userId: "123123",
    unique: true
  },
  2: {
    timestamp : "1547933494441",
    longURL: "http://www.google.com",
    shortURL: "9sm5xK",
    userId: "123456",
    unique: true
  }
};




/// Helper Functions
//  -----------------------

// is user logged in
function isLogged(req) {
  if (req.session.user_id === undefined) {
    return false;
  } else if (req.session.user_id !== undefined) {
    return true;
  }
}

//generate a random id
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

//get the list of URLs for the userId
function getUserURL(userID) {
  var userURLs = {};
  for (obj in urlDatabase) {
    if (urlDatabase[obj].userId === userID)
      {
      userURLs[obj] = urlDatabase[obj];
      userURLs[obj].visits = countVisits(userURLs[obj].id);
      userURLs[obj].unique = countUniqueVisits(userURLs[obj].id);
    }
  }
  return userURLs;
}



//get the owner of a specific shortURL
function getURLOwner (shortURL) {
  return urlDatabase[shortURL].userId;
}

function getURLvisitRecords(shortURL) {
  //create the function to retrieve the list of visits to display in the EDIT page
  let stats = {};
  for (let i in urlVisits) {
    if (urlVisits[i].shortURL == shortURL) {
      stats[i] = urlVisits[i];
    }
  }
  //console.log(stats)
  return stats;
}

function countVisits(shortURL) {
  let stats = getURLvisitRecords(shortURL);
  let count = Object.keys(stats).length;
  return count;
}

function countUniqueVisits(shortURL) {
  let count = 0;
  for (let i in urlVisits) {
    if (urlVisits[i].shortURL == shortURL && urlVisits[i].unique === true) {
      count++
    }
  }
  //console.log(stats)
  return count;
}

function trackURLVisit (shortURL,longURL,userId,unique) {
  //add a record in the urlVisits database each time a u/shortURL is opened
  let visitID = Object.keys(urlVisits).length + 1;
  let timestamp = timeConverter(new Date());
  urlVisits[visitID] = {
      timestamp: timestamp,
      longURL: longURL,
      shortURL: shortURL,
      userId: userId,
      unique: unique
    }
}

function timeConverter(UNIX_timestamp){
  var a = UNIX_timestamp;
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}




// GET Requests
// ------------

app.get("/", (req, res) => {
  if (isLogged(req)) {
    res.redirect("/urls");
  }
  else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  let templateVars = { user_id: req.session.user_id };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  if (isLogged(req)) {
    res.redirect("/urls");
  }
  let templateVars = {
    user_id: req.session.user_id
 };
  res.render("login", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  if (isLogged(req)) {
    let userId = req.session.user_id.id
    let userURL = getUserURL(userId);
    let templateVars = {
      urls: userURL,
      user_id: req.session.user_id
    }
    res.render("urls_index", templateVars);
  }
  else {
    res.status(401).send("You are not logged in. <a href='/login'>Login</a>");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id
  };
  if (isLogged(req)) {
    res.render("urls_new",templateVars);
  }
  else {
    res.redirect("/login");
  }
});


app.get("/urls/:id", (req, res) => {
  let shortLink = urlDatabase[req.params.id]
  if (shortLink === undefined) {
    res.status(404).send('Not Found!');
  }
  else if (getURLOwner(shortLink.id) != req.session.user_id.id) {
    res.status(400).send('you are not the URL owner!');
  }

  // get url visits stats
  let stats = getURLvisitRecords(req.params.id);
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user_id: req.session.user_id,
    stats: stats};
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  let shortLink = urlDatabase[req.params.shortURL];
  if (shortLink === undefined) {
    res.status(404).send('Not Found!');
  }
  else {
    let shortURL = req.params.shortURL;
    let longURL = shortLink.longURL;
    let uniqueTracker = false;
    let userId = "noUser";
    //check if no cookie
    if (req.session.unique == '' || req.session.unique == undefined) {
      //set uniqueTracker as true
      uniqueTracker = true;
      //set new cookie
      req.session.unique = generateRandomString();
    }
    if (isLogged(req)) {
      userId = req.session.user_id.id;
    }
    //track visit
    trackURLVisit(shortURL,longURL,userId,uniqueTracker);
    //redirect
    res.redirect(longURL);
  }
});


// POST Requests
// -------------

app.post("/login", (req, res) => {
  var emailInput = req.body.email;
  var passwordInput = req.body.password;
  //check if user exist
  var user = userLookup(emailInput);
  if (!user) {
    res.status(403).send('Email Not Found!');
  }
  else {
    //check if password is correct
    if (bcrypt.compareSync(passwordInput, user.password)) {
      // set the cookie user_id
      req.session.user_id = user;
      let link = "/";
      res.redirect(link);
    }
    else {
      res.status(403).send('Password Incorrect!');
    }
  }
});

// clear the cookie name email
app.post("/logout", (req, res) => {
  req.session = null;
  let link = "/urls";
  res.redirect(link);
});

app.post("/register", (req, res) => {
  //Registration Error Handling
  //Empty input => error
  if (req.body.email == '' || req.body.password == '') {
    res.status(400).send('Email or password is empty!');
  }
  // email already exists in DB
  else if (req.body.email != '') {
    for (let k in users) {
    if (users[k].email === req.body.email) {
      res.status(400).send('Email already used');
      }
    }
    const password = req.body.password
    const hashedPassword = bcrypt.hashSync(password, 10);
    //generate random id
    let userId = generateRandomString();
    // generate the object for the user to append to userDB
    let user = {
    id: userId,
    email: req.body.email,
    password: hashedPassword
    }
    //update userDB appending the new user
    users[userId] = user;
    //set cookie user_id
    req.session.user_id = user;
    //redirect
    let link = "/urls";
    res.redirect(link);
  };
});

app.post("/urls", (req, res) => {
  if (isLogged(req)) {
    let newId = generateRandomString();
    let userObj = req.session.user_id;
    urlDatabase[newId] = {
      id: newId,
      longURL: req.body.longURL,
      userId: userObj.id
    }
    let newLink = "/urls/" + newId;
    let templateVars = { shortURL: newId, longURL: req.body.longURL};
    res.redirect(newLink);
  } else {
    res.status(401).send("User Unauthorized");
  }

});


app.delete("/urls/:id", (req, res) => {

  let shortURL = req.params.id;
  if (req.session.user_id.id != urlDatabase[shortURL].userId) {
    res.status(400).send('you are not the URL owner!');
  }
  else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});


app.put("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let link = "/urls/";
  let longURL = req.body.longURL;
  let userObj = req.session.user_id
  if (isLogged(req) && req.session.user_id.id == urlDatabase[shortURL].userId) {
    urlDatabase[shortURL] = {
      id: shortURL,
      longURL: longURL,
      userId: userObj.id
    }
    res.redirect(link);
  } else if (isLogged(req) === false) {
    res.status(401).send("User Unauthorized");
  } else if (req.session.user_id.id != urlDatabase[shortURL].userId) {
    res.status(400).send('you are not the URL owner!');
  }

});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
