var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/LimsaGram");

var userSchema = mongoose.Schema({
  name: String,
  photo: String,
  username: String,
  email: String,
  bio: String,
  password: String,
  following: {
    type: Array,
    default: [],
  },
  follower: {
    type: Array,
    default: [],
  },
  token: {
    type: String,
    default: "",
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  Savedposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", userSchema);
