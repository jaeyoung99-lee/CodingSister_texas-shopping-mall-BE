const { populate } = require("dotenv");
const Cart = require("../models/Cart");

const cartController = {};

cartController.addItemToCart = async (req, res) => {
  try {
    const { userId } = req;
    const { productId, size, qty } = req.body;
    // 유저를 이용해 유저에 해당하는 카트 찾기
    let cart = await Cart.findOne({ userId: userId }); // 앞의 userId는 Cart.js에 있는 userId, 뒤의 userId는 위에 req에서 불러온 userId(auth.controller.js에서 authenticate에서 req로 보낸 userId)
    // 유저가 만든 카트가 없을 시, 현재 로그인 된 유저에 해당하는 카트 만들어 주기
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }
    // 카트에 이미 들어가 있는 아이템인지 확인
    // type이 mongoose.ObjectId인 경우에는 비교할 때 ===을 못 쓰고 equals를 써야 함
    const existItem = cart.items.find(
      (item) => item.productId.equals(productId) && item.size === size
    );
    // 이미 들어가 있으면 에러 -> "해당 아이템이 이미 카트에 있습니다."
    if (existItem) {
      throw new Error("해당 아이템이 이미 카트에 있습니다.");
    }
    // 새로운 아이템일 경우 카트에 아이템을 추가
    cart.items = [...cart.items, { productId, size, qty }];
    await cart.save();

    res
      .status(200)
      .json({ status: "success", data: cart, cartItemQty: cart.items.length });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.getCart = async (req, res) => {
  try {
    const { userId } = req;
    const cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: {
        path: "productId",
        model: "Product",
      },
    });
    res.status(200).json({ status: "success", data: cart.items });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;
    const cart = await Cart.findOne({ userId });
    cart.items = cart.items.filter((item) => !item._id.equals(id));
    await cart.save();

    res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.editCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;
    const { qty } = req.body;
    const cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: {
        path: "productId",
        model: "Product",
      },
    });
    if (!cart) {
      throw new Error("There is no cart for this user");
    }
    const index = cart.items.findIndex((item) => item._id.equals(id));
    if (index === -1) {
      throw new Error("Can not find item");
    }
    cart.items[index].qty = qty;
    await cart.save();
    res.status(200).json({ status: 200, data: cart.items });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = cartController;
