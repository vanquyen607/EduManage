/**
 * Tạo URL mã QR thanh toán theo tiêu chuẩn VietQR
 */
export function getPaymentQRUrl(amount: number, addInfo: string, config: { shortName: string, accountNumber: string, accountName: string }) {
  // Loại bỏ dấu tiếng Việt và khoảng trắng cho nội dung chuyển khoản
  const normalizedInfo = addInfo
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `https://img.vietqr.io/image/${config.shortName}-${config.accountNumber}-compact.png?amount=${amount}&addInfo=${normalizedInfo}&accountName=${encodeURIComponent(config.accountName)}`;
}
