import express from "express";
import User from "./models/UserModel.js";
import users from "./data/User.js";
import Product from "./models/ProductModel.js";
import products from "./data/Product.js";
import asyncHandler from "express-async-handler";

const importData = express.Router();

importData.post(
  "/user",
  asyncHandler(async (req, res) => {
    await User.deleteMany({});
    const importUsers = await User.insertMany(users);
    res.send({ importUsers });
  })
);

importData.post(
  "/products",
  asyncHandler(async (req, res) => {
    await Product.deleteMany({});
    const importProducts = await Product.insertMany(products);
    res.send({ importProducts });
  })
);

export default importData;
