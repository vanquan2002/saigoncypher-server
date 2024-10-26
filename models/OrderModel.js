import mongoose from "mongoose";

const orderScheme = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderItems: [
      {
        name: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        size: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        thumbImage: {
          type: String,
          required: true,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
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
    paymentMethod: {
      type: String,
      default: "COD",
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderScheme);

export default Order;
