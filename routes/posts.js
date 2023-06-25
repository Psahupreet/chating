var mongoose = require("mongoose");

var postSchema = mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  Ext: String,
  img: String,
  text: String,
  like: {
    type: Array,
    default: [],
  },
},
{timestamps: true}
);

module.exports = mongoose.model("post", postSchema);
