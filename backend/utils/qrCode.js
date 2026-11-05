const QRCode = require("qrcode");

const generateQrDataUrl = (url) => QRCode.toDataURL(url, {
  errorCorrectionLevel: "M",
  type: "image/png",
  margin: 1,
  width: 256,
  color: { dark: "#1A1A1A", light: "#FFFFFF" },
});

module.exports = { generateQrDataUrl };
