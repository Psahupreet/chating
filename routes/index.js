var express = require("express");
var router = express.Router();
const passport = require("passport");
var userModel = require("./users");
var chatModel = require("./chats");
const upload = require("./grid");
const multer = require("multer");
const path = require("path");
const nodeMailer = require("../nodemailer");
const crypto = require("crypto");
var postModel = require("./posts");
const { futimesSync } = require("fs");
const { use } = require("passport");
var gridfsStream = require("gridfs-stream");
var mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const localStrategy = require("passport-local");

passport.use(new localStrategy(userModel.authenticate()));

var connect = mongoose.connection;

let gfs;
let gfsBucket;

connect.once("open", function () {
  gfs = gridfsStream(connect.db, mongoose.mongo);
  gfs.collection("uploads");
  gfsBucket = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: "uploads",
  });
});

router.get('/savePost/:id', isLoggedIn, function (req, res) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      postModel.findOne({ _id: req.params.id }).then(function (post) {
        if (loggedInUser.Savedposts.indexOf(post._id) === -1) {
          loggedInUser.Savedposts.push(post._id);
        } else {
          loggedInUser.Savedposts.splice(
            loggedInUser.Savedposts.indexOf(post._id),
            1
          );
        }
        post.save().then(function () {
          loggedInUser.save().then(function () {
            res.redirect("back");
          });
        });
      });
    });
});

router.get("/getFile/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }).then(function () {});
  gfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
});

router.post("/savechat", async function (req, res, next) {
  var Chat = new chatModel({
    sender_id: req.body.sender_id,
    reciever_id: req.body.reciever_id,
    message: req.body.message,
  });
  var newChat = await Chat.save();
  res.status(200).send({ success: true, msg: "Chat Inserted!", data: newChat });
});

router.get("/chat", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (user) {
      userModel.find({ _id: { $nin: [user._id] } }).then(function (allUser) {
        res.render("chat", { user, allUser });
      });
    });
});

router.get("/user/:id", async function (req, res, next) {
  let loggedInUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  let user = await userModel.findOne({ _id: req.params.id }).populate("posts");
  res.render("UserProfile", { user, loggedInUser });
});

router.get("/follow/:id", function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      userModel
        .findOne({ _id: req.params.id })
        .then(function (JisseFriendBananaHai) {
          if (loggedInUser.following.indexOf(JisseFriendBananaHai._id) === -1) {
            loggedInUser.following.push(JisseFriendBananaHai._id);
          } else {
            loggedInUser.following.splice(
              loggedInUser.following.indexOf(JisseFriendBananaHai._id),
              1
            );
          }
          if (JisseFriendBananaHai.follower.indexOf(loggedInUser._id) === -1) {
            JisseFriendBananaHai.follower.push(loggedInUser._id);
          } else {
            JisseFriendBananaHai.follower.splice(
              JisseFriendBananaHai.follower.indexOf(loggedInUser._id),
              1
            );
          }
          loggedInUser.save().then(function () {
            JisseFriendBananaHai.save().then(function () {
              res.redirect("back");
            });
          });
        });
    });
});

router.post("/searchUser", async function (req, res, next) {
  var search = "";
  if (req.body.search) {
    search = req.body.search;
  }
  var data = await userModel.find({
    username: { $regex: ".*" + search + ".*", $options: "i" },
  });
  res.status(200).send({ success: true, data: data });
});

router.get("/like/:id", function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      postModel.findOne({ _id: req.params.id }).then(function (post) {
        if (post.like.indexOf(loggedInUser._id) === -1) {
          post.like.push(loggedInUser._id);
        } else {
          post.like.splice(post.like.indexOf(loggedInUser._id), 1);
        }
        post.save().then(function () {
          loggedInUser.save().then(function () {
            res.redirect("back");
          });
        });
      });
    });
});

router.get("/edit", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (user) {
      res.render("edit", { user });
    });
});

router.post("/update", isLoggedIn, function (req, res, next) {
  userModel
    .findOneAndUpdate(
      { username: req.session.passport.user },
      {
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        bio: req.body.bio,
      }
    )
    .then(function () {
      res.redirect("/profile");
    });
});

router.get("/home", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (user) {
      postModel
        .find()
        .populate("userid")
        .sort("-createdAt")
        .then(function (post) {
          res.render("home", { post, user });
        });
    });
});

router.post("/upload", upload.single("photo"), function (req, res, next) {
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (loggedInUser) {
      loggedInUser.photo = req.file.filename;
      loggedInUser.save().then(function () {
        res.redirect("/profile");
      });
    });
});

router.post("/upload/post",
  upload.single("post"),
  isLoggedIn,
  function (req, res, next) {
    userModel
      .findOne({ username: req.session.passport.user })
      .then(function (user) {
        postModel
          .create({
            userid: user._id,
            text: req.body.text
          })
          .then(function (post) {
            var Ext = req.file.filename;
            var FileExt = Ext.substring(Ext.lastIndexOf(".") + 1);
            post.Ext = FileExt;
            post.img = req.file.filename;
            user.posts.push(post._id);
            post.save();
            user.save();
            res.redirect("/profile");
          });
      });
  }
);

router.get("/profile", isLoggedIn, function (req, res) {
  userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .then(function (user) {
      res.render("profile", { user });
    });
});

router.get("/reset/:userid/:token", async function (req, res, next) {
  let user = await userModel.findOne({ _id: req.params.userid });
  if (user.token === req.params.token) {
    res.render("reset", { user });
  } else {
    res.send("Abee saale");
  }
});

router.post("/reset/:id", async function (req, res, next) {
  let user = await userModel.findOne({ _id: req.params.id });
  user.setPassword(req.body.password);
  user.save();
  res.send("ho gya");
});

router.get("/forgot", function (req, res, next) {
  res.render("forgot");
});

router.post("/forgot", function (req, res, next) {
  userModel.findOne({ email: req.body.email }).then(function (user) {
    if (user) {
      crypto.randomBytes(17, function (err, buff) {
        var rnstr = buff.toString("hex");
        user.token = rnstr;
        user.save();
        nodeMailer(req.body.email, user._id, rnstr);
        res.send("password reset link sent to your email account");
      });
    } else {
      res.send("account hi nhi hai");
    }
  });
});

router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post("/register", function (req, res, next) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name,
  });
  userModel
    .register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    })
    .catch(function (e) {
      res.send(e);
    });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    // failureRedirect: '/loginfail'
    failWithError: true,
  }),
  function (err, req, res, next) {
    return res.redirect("/login");
  }
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
