var mongoose = require("mongoose");

var commentSchema = mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    comment: String,
    like: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", commentSchema);
