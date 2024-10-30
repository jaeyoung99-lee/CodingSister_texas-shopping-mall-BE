const Product = require("../models/Product");
const DEFAULT_PAGE_SIZE = 5;

const productController = {};

productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;
    const product = new Product({
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    });

    await product.save();
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProducts = async (req, res) => {
  try {
    const { page, name, limit } = req.query;
    const PAGE_SIZE = parseInt(limit) || DEFAULT_PAGE_SIZE; // 쿼리의 limit이 없으면 기본값인 5 사용
    const cond = name
      ? {
          name: { $regex: name, $options: "i" }, // $options: "i" 사용하여 대소문자 구분 안하게 해줌
        }
      : {};
    let query = Product.find(cond);
    let response = { status: "success" };
    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      // 최종 몇 개 페이지
      // 전체 페이지 개수 = 전체 데이터 개수 / 페이지 사이즈
      // 데이터가 총 몇 개 있는지
      const totalItemNum = await Product.find(cond).countDocuments();
      // 데이터 총 개수 / 페이지 사이즈
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      response.totalPageNum = totalPageNum;
    }
    const productList = await query.exec();
    response.data = productList;
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = productController;
