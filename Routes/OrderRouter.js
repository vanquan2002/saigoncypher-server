import express from "express";
import asyncHandler from "express-async-handler";
import Order from "./../models/OrderModel.js";
import { admin, protect } from "./../MiddleWare/AuthMiddleware.js";

const orderRoute = express.Router();

orderRoute.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderItems,
      deliveryInformation,
      itemsPrice,
      shippingPrice,
      totalPrice,
      note,
    } = req.body;
    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("Không có sản phẩm nào để đặt!");
    } else {
      const order = new Order({
        user: req.user._id,
        orderItems,
        deliveryInformation,
        itemsPrice,
        shippingPrice,
        totalPrice,
        note,
        orderStatus: {
          isPrepared: true,
          preparedAt: Date.now(),
        },
      });
      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
);

orderRoute.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({
        _id: -1,
      })
      .populate("user", "id name email");
    res.json(orders);
  })
);

orderRoute.get(
  "/:id/details",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

orderRoute.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.find({ user: req.user._id }).sort({
      _id: -1,
    });
    res.json(order);
  })
);

orderRoute.put(
  "/:id/deliver",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      if (!order.orderStatus.isCancelled) {
        order.orderStatus.isDelivered = true;
        order.orderStatus.deliveredAt = Date.now();
        const updatedOrder = await order.save();
        res.json(updatedOrder);
      } else {
        res.status(404);
        throw new Error("Đơn hàng đã bị hủy, không thể giao!");
      }
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

orderRoute.put(
  "/:id/receive",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.orderStatus.isReceived = true;
      order.orderStatus.receivedAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

orderRoute.put(
  "/:id/pay",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.orderStatus.isPaid = true;
      order.orderStatus.paidAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

orderRoute.put(
  "/:id/cancel",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      if (!order.orderStatus.isDelivered) {
        order.orderStatus.isCancelled = true;
        order.orderStatus.cancelledAt = Date.now();
        const updatedOrder = await order.save();
        res.json(updatedOrder);
      } else {
        res.status(404);
        throw new Error("Đơn hàng đang được vận chuyển, không thể hủy!");
      }
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

orderRoute.put(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    const order = await Order.findById(req.params.id);
    if (order) {
      const items = order.orderItems.filter(
        (item) => item.product.toString() === id
      );
      if (items.length > 0) {
        items.forEach((item) => {
          item.isReview = true;
        });
        await order.save();
        res.json({ message: "Cập nhật đánh giá đơn hàng thành công!" });
      } else {
        res.status(404);
        throw new Error(
          "Không tìm thấy mã sản phẩm nào được chỉ định trong đơn hàng để cập nhật!"
        );
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy mã đơn hàng!");
    }
  })
);

export default orderRoute;
