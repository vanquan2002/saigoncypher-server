import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    deliveryInformation: {
      fullName: {
        type: String,
        default: null,
      },
      province: {
        type: String,
        default: null,
      },
      district: {
        type: String,
        default: null,
      },
      ward: {
        type: String,
        default: null,
      },
      address: {
        type: String,
        default: null,
      },
      phone: {
        type: String,
        default: null,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userScheme.methods.matchPassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

userScheme.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userScheme);

export default User;
