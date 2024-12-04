import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const productScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    returnPolicy: {
      type: String,
      required: true,
    },
    storageInstructions: {
      type: String,
      required: true,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    thumbImage: {
      type: String,
      required: true,
    },
    images: {
      type: [
        {
          image: {
            type: String,
            required: [true, "Đường dẫn ảnh là bắt buộc."],
          },
          description: {
            type: String,
            required: [true, "Mô tả ngắn là bắt buộc."],
          },
        },
      ],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "Phải có ít nhất một ảnh sản phẩm.",
      },
    },

    sizes: {
      type: [
        {
          size: {
            type: String,
            required: [true, "Cỡ là bắt buộc."],
          },
          countInStock: {
            type: Number,
            required: [true, "Số lượng là bắt buộc."],
          },
        },
      ],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "Phải có ít nhất một cỡ.",
      },
    },

    color: {
      type: String,
      required: true,
    },
    model: {
      size: {
        type: String,
        required: true,
      },
      height: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productScheme);

export default Product;
