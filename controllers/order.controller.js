const orderController = {};
const Order = require("../models/Order");
const productController = require("./product.controller");
const { randomStringGenerator } = require("../utils/randomStringGenerator");

orderController.createOrder = async (req, res) => {
  try {
    // 프론트엔드에서 데이터 보낸 거 받아오기(userId, totalPrice, shipTo, contact, orderList)
    const { userId } = req;
    const { shipTo, contact, totalPrice, orderList } = req.body;

    // 재고 확인 & 재고 업데이트
    const insufficientStockItems = await productController.checkItemListStock(
      orderList
    );

    // 재고가 충분하지 않은 아이템이 있을 경우 -> 에러 메시지
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.reduce(
        (total, item) => (total += item.message),
        ""
      );
      throw new Error(errorMessage);
    }

    // order 만들기
    const newOrder = new Order({
      userId,
      totalPrice,
      shipTo,
      contact,
      items: orderList,
      orderNum: randomStringGenerator(),
    });

    await newOrder.save();
    res.status(200).json({ status: "success", orderNum: newOrder.orderNum });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getOrder = async (req, res, next) => {
  try {
    const { userId } = req;
    const orderList = await Order.find({ userId }).populate({
      path: "items",
      populate: {
        path: "productId",
        model: "Product",
        select: "image name",
      },
    });
    const totalItemNum = await Order.find({ userId }).countDocuments();
    const totalPageNum = Math.ceil(totalItemNum / 5);
    res.status(200).json({ status: "success", data: orderList, totalPageNum });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getOrderList = async (req, res) => {
  try {
    let { page, orderNum } = req.query;
    page = page || 1;

    // 몽구스만 사용하는 용도 $regex
    const cond = orderNum
      ? {
          orderNum: { $regex: orderNum, $options: "i" },
        }
      : {};

    const orderList = await Order.find(cond)
      .populate("userId")
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
          select: "image name",
        },
      })
      .skip((page - 1) * 5)
      .limit(5);

    const totalItemNum = await Order.find(cond).countDocuments();
    const totalPageNum = Math.ceil(totalItemNum / 5);

    res.status(200).json({ status: "success", data: orderList, totalPageNum });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

orderController.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) throw new Error("Order not found");

    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    res.status(400).json({ status: "fail", data: error.message });
  }
};

module.exports = orderController;
