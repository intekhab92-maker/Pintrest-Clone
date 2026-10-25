const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    imageText: {
      type: String,
      
    },
    image: {
      type: String,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String
    },
    
  createdAt: {
    type: Date,
    default: Date.now(),
  }
  }
);

module.exports = mongoose.model("Post", postSchema);