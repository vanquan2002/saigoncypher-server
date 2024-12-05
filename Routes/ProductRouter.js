import express from "express";
import asyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import { admin, protect } from "./../MiddleWare/AuthMiddleware.js";

const productRoute = express.Router();

const createSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
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
      .select("name slug price thumbImage")
      .limit(pageSize)
      .skip(skip)
      .sort({ _id: -1 });
    res.json({ products, page, pages: maxPage });
  })
);

productRoute.get(
  "/admin",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

productRoute.get(
  "/:slug/detail",
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate([
      { path: "reviews.user", model: "User", select: "name avatar" },
    ]);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy mã sản phẩm này!");
    }
  })
);

productRoute.get(
  "/:id/admin",
  protect,
  admin,
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
      const relatedProducts = await Product.find({
        _id: { $ne: product },
      }).select("name slug price thumbImage");
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
      const review = {
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
      res.status(201).json({ message: "Đánh giá thành công!" });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy mã sản phẩm!");
    }
  })
);

productRoute.delete(
  "/:id/admin",
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
  "/all/admin",
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
  "/admin",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      returnPolicy,
      storageInstructions,
      price,
      thumbImage,
      images,
      sizes,
      color,
      model,
    } = req.body;
    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.status(400);
      throw new Error("Tên sản phẩm đã tồn tại!");
    } else {
      const product = new Product({
        name,
        slug: createSlug(name),
        description,
        returnPolicy,
        storageInstructions,
        price,
        thumbImage,
        images,
        sizes,
        color,
        model,
      });
      await product.save();
      res.status(201).json({ message: "Thêm sản phẩm thành công!" });
    }
  })
);

productRoute.put(
  "/:id/admin",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      returnPolicy,
      storageInstructions,
      price,
      thumbImage,
      images,
      sizes,
      color,
      model,
    } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.returnPolicy = returnPolicy || product.returnPolicy;
      product.storageInstructions =
        storageInstructions || product.storageInstructions;
      product.price = price || product.price;
      product.thumbImage = thumbImage || product.thumbImage;
      product.images = images || product.images;
      product.sizes = sizes || product.sizes;
      product.color = color || product.color;
      product.model = {
        ...product.model,
        ...(model.size && { size: model.size }),
        ...(model.height && { height: model.height }),
      };

      const updateProduct = await product.save();
      res.json(updateProduct);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy mã sản phẩm này!");
    }
  })
);

export default productRoute;
