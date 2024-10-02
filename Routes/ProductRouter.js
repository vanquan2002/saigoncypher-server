import express from "express";
import asyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import { admin, protect } from "./../MiddleWare/AuthMiddleware.js";

const productRoute = express.Router();

productRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 8;
    let page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    const maxPage = Math.ceil(count / pageSize);
    if (page < 1 || page > maxPage) {
      page = 1;
    }
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ products, page, pages: maxPage });
  })
);

productRoute.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

productRoute.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Product not found!");
    }
  })
);

productRoute.get(
  "/related/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      const relatedProducts = await Product.find({ _id: { $ne: product } });
      res.json(relatedProducts);
    } else {
      res.status(404);
      throw new Error("Related product not found!");
    }
  })
);

productRoute.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Product already reviewed!");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
      await product.save();
      res.status(201).json({ message: "Reviewed added" });
    } else {
      res.status(404);
      throw new Error("Product not found!");
    }
  })
);

productRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.deleteOne({ _id: req.params.id });
      res.json({ message: "Product deleted" });
    } else {
      res.status(404);
      throw new Error("Product not found!");
    }
  })
);

productRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, description, price, thumbImage, images, sizes, color } =
      req.body;
    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.status(400);
      throw new Error("Product name already exist!");
    } else {
      const product = new Product({
        name,
        description,
        price,
        thumbImage,
        images,
        sizes,
        color,
      });
      if (product) {
        const createProduct = await product.save();
        res.status(201).json(createProduct);
      } else {
        res.status(400);
        throw new Error("Invalid product data!");
      }
    }
  })
);

productRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.image = image || product.image;
      product.price = price || product.price;
      product.countInStock = countInStock || product.countInStock;
      const updateProduct = await product.save();
      res.json(updateProduct);
    } else {
      res.status(404);
      throw new Error("Product not found!");
    }
  })
);

export default productRoute;
