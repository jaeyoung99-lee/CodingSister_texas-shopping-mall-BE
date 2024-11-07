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

    // SKU 중복 체크
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res
        .status(400)
        .json({ status: "fail", error: "SKU가 이미 존재합니다." });
    }

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
    const { page, name, limit, sort, order } = req.query;
    const PAGE_SIZE = parseInt(limit) || DEFAULT_PAGE_SIZE; // 쿼리의 limit이 없으면 기본값인 5 사용
    const cond = name
      ? {
          name: { $regex: name, $options: "i" }, // $options: "i" 사용하여 대소문자 구분 안하게 해줌
          isDeleted: false,
        }
      : { isDeleted: false };
    let query = Product.find(cond);

    if (sort) {
      query = query.sort({ [sort]: order === "desc" ? -1 : 1 }); // 내림차순 또는 오름차순 정렬
    }

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

productController.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("No item found");
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      name,
      size,
      image,
      price,
      description,
      category,
      stock,
      status,
    } = req.body;
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      {
        sku,
        name,
        size,
        image,
        price,
        description,
        category,
        stock,
        status,
      },
      { new: true }
    );
    if (!product) {
      throw new Error("item doesn't exist");
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { isDeleted: true }
    );
    if (!product) {
      throw new Error("No item found");
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.checkStock = async (item) => {
  // 내가 사려는 아이템 재고 정보 들고오기
  const product = await Product.findById(item.productId);

  // 내가 사려는 아이템 qty와 재고 비교
  if (product.stock[item.size] < item.qty) {
    // 재고가 불충분하면 불충분 메시지와 함께 데이터 반환
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 재고가 부족합니다.`,
    };
  }

  // 재고 충분: 차감하지 않고 확인만 통과
  return { isVerify: true };
};

productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = []; // 재고가 불충분한 아이템을 저장할 예정

  // 1. 모든 상품의 재고 확인
  for (const item of itemList) {
    const stockCheck = await productController.checkStock(item);

    if (!stockCheck.isVerify) {
      insufficientStockItems.push({
        item,
        message: stockCheck.message,
      });
    }
  }

  // 2. 재고 부족 상품이 있으면 바로 반환
  if (insufficientStockItems.length > 0) {
    return insufficientStockItems;
  }

  // 3. 모든 재고가 충분한 경우에만 재고 차감
  await Promise.all(
    itemList.map(async (item) => {
      const product = await Product.findById(item.productId);
      product.stock[item.size] -= item.qty;
      product.markModified("stock");
      await product.save();
    })
  );

  return [];
};

module.exports = productController;
