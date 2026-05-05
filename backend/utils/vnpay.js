const crypto = require("crypto");
const qs = require("qs");

const tmnCode = process.env.VNP_TMN_CODE;
const secretKey = process.env.VNP_HASH_SECRET;
const vnpUrl = process.env.VNP_URL;
const returnUrl = process.env.VNP_RETURN_URL;

// =======================
// sort object chuẩn VNPay
// =======================
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }

  str.sort();

  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }

  return sorted;
}

// =======================
// tạo url thanh toán
// =======================
function createPaymentUrl({
  orderId,
  amount,
  orderInfo,
  ipAddr,
}) {
  // ── Kiểm tra env vars bắt buộc ──────────────────────────────────────────
  if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
    const missing = [];
    if (!tmnCode)   missing.push("VNP_TMN_CODE");
    if (!secretKey) missing.push("VNP_HASH_SECRET");
    if (!vnpUrl)    missing.push("VNP_URL");
    if (!returnUrl) missing.push("VNP_RETURN_URL");
    throw new Error(
      `VNPay chưa được cấu hình đầy đủ. Thiếu biến môi trường: ${missing.join(", ")}`
    );
  }

  const date = new Date();

  const createDate =
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const txnRef = `${orderId}_${Date.now()}`;

  let params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  params = sortObject(params);

  const signData = qs.stringify(params, {
    encode: false,
  });

  const secureHash = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  params.vnp_SecureHash = secureHash;

  const paymentUrl =
    vnpUrl +
    "?" +
    qs.stringify(params, {
      encode: false,
    });

  return {
    paymentUrl,
    txnRef,
  };
}

// =======================
// verify callback
// =======================
function verifyReturnUrl(query) {
  let params = { ...query };

  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  params = sortObject(params);

  const signData = qs.stringify(params, {
    encode: false,
  });

  const checkSum = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return {
    isValid: secureHash === checkSum,
    responseCode: params.vnp_ResponseCode,
    txnRef: params.vnp_TxnRef,
    amount: Number(params.vnp_Amount) / 100,
    transactionNo: params.vnp_TransactionNo,
    rawData: params,
  };
}

function verifyIPN(query) {
  return verifyReturnUrl(query);
}

function getResponseMessage(code) {
  const map = {
    "00": "Thành công",
    "24": "Đã hủy",
    "51": "Không đủ tiền",
    "99": "Lỗi không xác định",
  };

  return map[code] || code;
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  verifyIPN,
  getResponseMessage,
};