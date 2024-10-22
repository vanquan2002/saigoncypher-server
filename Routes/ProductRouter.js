import express from "express";
import asyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import { admin, protect } from "./../MiddleWare/AuthMiddleware.js";

const productRoute = express.Router();

const createSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD") // Chuyển đổi sang dạng không dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/[^\w-]+/g, "") // Xóa ký tự đặc biệt
    .replace(/--+/g, "-") // Xóa dấu gạch ngang liên tiếp
    .trim(); // Xóa khoảng trắng ở đầu và cuối
};
const removeDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

productRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 8;
    let page = Math.max(Number(req.query.pageNumber) || 1, 1);
    const keyword = req.query.keyword
      ? removeDiacritics(req.query.keyword.trim())
      : "";
    const searchQuery = keyword
      ? {
          $and: keyword
            .split(" ")
            .filter(Boolean)
            .map((word) => ({ slug: { $regex: word, $options: "i" } })),
        }
      : {};
    const count = await Product.countDocuments(searchQuery);
    const maxPage = Math.ceil(count / pageSize);
    page = Math.min(page, maxPage);
    const skip = Math.max(0, pageSize * (page - 1));
    const products = await Product.find(searchQuery)
      .limit(pageSize)
      .skip(skip)
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
      throw new Error("Không tìm thấy mã sản phẩm này!");
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
      throw new Error("Không tìm thấy sản phẩm liên quan!");
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
      product.rating = (
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length
      ).toFixed(1);
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
      res.json({ message: "Xóa sản phẩm thành công!" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy mã sản phẩm này!");
    }
  })
);

productRoute.delete(
  "/delete/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.deleteMany({});
    if (products.deletedCount > 0) {
      res.json({ message: "Tất cả sản phẩm đã được xóa!" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy sản phẩm nào để xóa!");
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
      throw new Error("Tên sản phẩm đã tồn tại!");
    } else {
      const product = new Product({
        name,
        slug: createSlug(name),
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
        throw new Error("Dữ liệu sản phẩm không hợp lệ!");
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