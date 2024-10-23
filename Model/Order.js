const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");
const Schema = mongoose.Schema;

const orderSChema = Schema(
  {
    shipTo: { type: Object, required: true },
    contact: { type: Object, required: true },
    totalPrice: { type: Number, default: 0, required: true },
    userId: { type: mongoose.ObjectId, ref: User },
    status: { type: String, default: "preparing" },
    items: [
      {
        productId: { type: mongoose.ObjectId, ref: Product },
        size: { type: String, required: true },
        qty: { type: Number, default: 1, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

orderSChema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.updatedAt;
  return obj;
};

const Order = mongoose.model("Order", orderSChema);

module.exports = Order;
