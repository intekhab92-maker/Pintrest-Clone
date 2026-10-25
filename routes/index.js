var express = require("express");
var router = express.Router();
var postModel = require("./posts");
var userModel = require("./users");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var upload = require("./multer");

passport.use(new LocalStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.render("index");
});

router.get("/login", function (req, res) {
  res.render("login", {error: req.flash("error")});
});

router.get("/feed", isLoggedIn ,async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
 const posts = await postModel.find()
  .populate("user")
   res.render("feed", { user, posts, returnDocument: 'after' });
});
  
 

router.get("/show", isLoggedIn ,async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts")
   res.render("show", { user });
});

router.post("/fileupload",isLoggedIn, upload.single("dp"), async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
    user.dp = req.file.filename,
    await user.save();
   res.redirect("/profile");
});

router.post("/upload", upload.single("file"), async function (req, res) {
  if(!req.file){
    return res.status(404).send("file were not given")
  }
  const user = await userModel.findOne({
    username: req.session.passport.user});
  
  const post = await postModel.create({
    title: req.body.title,
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });
  user.posts.push(post);
  await user.save();
  res.redirect("/feed");
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts")
   res.render("profile", { user });
});

router.get("/add", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
   res.render("add", { user });
});

router.get("/createpin", isLoggedIn, function (req, res) {
  res.render("createpin"); 
});

router.get("/editprofile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("editprofile", {user}); 
});

router.post("/update-profile", isLoggedIn, async (req, res) => {

    const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        {
            fullName: req.body.fullname,
            username: req.body.username,
            description: req.body.description
        },
        { returnDocument: 'after' }
    );
    res.redirect("/profile");
});

router.post("/register", function (req, res) {
  const { username, fullName, email, password } = req.body;
  const user = new userModel({username, fullName, email});

  userModel
    .register(user, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/login");
      });
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.post("/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true
  })
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;