import express from "express";
import asyncHandler from "express-async-handler";
import User from "./../models/UserModel.js";
import generateToken from "../utils/generateToken.js";
import { protect, admin } from "../MiddleWare/AuthMiddleware.js";

const userRoute = express.Router();

// LOGIN
userRoute.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        deliveryInformation: user.deliveryInformation,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Email hoặc mật khẩu không đúng!");
    }
  })
);

// REGISTER
userRoute.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("Email đã tồn tại!");
    }
    const user = await User.create({
      name,
      email,
      password,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        deliveryInformation: user.deliveryInformation,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid User Data");
    }
  })
);

userRoute.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        deliveryInformation: user.deliveryInformation,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

userRoute.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
  })
);

userRoute.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.avatar = req.body.avatar || user.avatar;

      user.deliveryInformation.fullName =
        req.body.fullName || user.deliveryInformation.fullName;
      user.deliveryInformation.province =
        req.body.province || user.deliveryInformation.province;
      user.deliveryInformation.district =
        req.body.district || user.deliveryInformation.district;
      user.deliveryInformation.ward =
        req.body.ward || user.deliveryInformation.ward;
      user.deliveryInformation.address =
        req.body.address || user.deliveryInformation.address;
      user.deliveryInformation.phone =
        req.body.phone || user.deliveryInformation.phone;

      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        deliveryInformation: updatedUser.deliveryInformation,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
        createdAt: updatedUser.createdAt,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

export default userRoute;
