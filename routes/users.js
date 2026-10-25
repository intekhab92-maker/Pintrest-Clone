var mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose").default;
  
mongoose.connect('mongodb://127.0.0.1:27017/pintrestProject');


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    dp: {
      type: String, // URL or file path of profile picture
      default: "",
    },
    
    description: {
      type: String
    },

    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    }],
    createdAt: {
    type: Date,
    default: Date.now,
  }
  },
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);




