
const express = require("express");
const router = express.Router();
const passport = require("passport");
const localStrategy = require("passport-local");
const userModel = require("./users");
const postModel = require("./posts");
const upload = require("./multer"); 

passport.use(new localStrategy(userModel.authenticate()));

// 1. Register Page
router.get("/", function (req, res) {
  res.render("index", { title: "Pinterest" });
});

// 2. Login Page 
router.get("/login", function (req, res) {
  res.render("login", { error: req.flash("error") });
});

// 3. User Profile Route
router.get("/profile", isLoggedIn, async function(req, res) {
  const user = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("profile", { user });
});

// 4. Feed Page Route
router.get("/feed", isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  const allPosts = await postModel.find().populate("user");
  const validPosts = allPosts.filter((post) => post.user !== null);

  res.render("feed", { user, posts: validPosts });
});

// 5. Create Pin Page Route
router.get("/createpin", isLoggedIn, async function (req, res) {
  res.render("createpin");
});

// 6. Edit Profile Page Route
router.get("/editprofile", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("editprofile", { user });
});


router.post("/update-profile", isLoggedIn, async function (req, res) {
  try {
    const updatedUser = await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      {
        fullName: req.body.fullname,
        username: req.body.username,
        description: req.body.description,
      },
      { returnDocument: "after" }, // Returns the updated document
    );

    if (req.session.passport.user !== updatedUser.username) {
      req.session.passport.user = updatedUser.username;
    }

    res.redirect("/profile");
  } catch (err) {
    res
      .status(500)
      .send("Error updating profile. The username might already be taken.");
  }
});


router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("dp"),
  async function (req, res) {
    try {
      // Prevent crashes if the form submits without a file
      if (!req.file) {
        return res.redirect("/profile");
      }

      const user = await userModel.findOne({
        username: req.session.passport.user,
      });

      // Update the database field to the new image filename
      user.dp = req.file.filename;
      await user.save();

      res.redirect("/profile");
    } catch (err) {
      res.status(500).send("Error updating profile picture.");
    }
  },
);

// 7. Show User Posts Route
router.get("/show", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("show", { user });
});

// --- AUTHENTICATION ---

// Register User
router.post("/register", function (req, res) {
  const { username, fullName, email } = req.body;
  const userData = new userModel({ username, fullName, email });

  userModel
    .register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/login");
      });
    })
    .catch(function (err) {
      res.redirect("/");
    });
});

// Login User
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  }),
);

// Upload Post Route (using multer)
router.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  async function (req, res) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      imageText: req.body.description,
      image: req.file.filename,
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/feed");
  },
);

// Logout User
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// Auth Middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;