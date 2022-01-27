const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  nanoid
} = require("nanoid");
const Service = require("./service")

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => nanoid(5),
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid')
      }
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain "password"')
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  address: {
    type: String,
    required: true,
    trim: true,
  },
  phone_no: {
    type: Number,
    required: true,
    trim: true,
  },
  house_type: {
    type: String,
    required: true,
    trim: true,
  },
  services: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject
}

userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({
    _id: user._id.toString()
  }, process.env.JWT_SECRET)

  user.tokens = user.tokens.concat({
    token
  })
  await user.save()

  return token
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({
    email
  })

  if (!user) {
    throw new Error('Unable to login')
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login')
  }

  return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete user tasks when user is removed
// userSchema.pre('remove', async function (next) {
//     const user = this
//     await Service.deleteMany({ owner: user._id })
//     next()
// })

const User = mongoose.model("User", userSchema);

module.exports = User;