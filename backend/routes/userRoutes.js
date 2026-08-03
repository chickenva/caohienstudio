// Router người dùng: khách hàng và tài khoản admin.
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// ADMIN: CUSTOMERS
// ==========================================
router.get(
  "/admin/customers/search",
  verifyAdmin,
  userController.searchCustomersForAdmin,
);

router.get(
  "/admin/customers",
  verifyAdmin,
  userController.getAllCustomersForAdmin,
);

router.get(
  "/admin/customers/:id",
  verifyAdmin,
  userController.getCustomerDetailForAdmin,
);

router.patch(
  "/admin/customers/:id/toggle-active",
  verifyAdmin,
  userController.toggleCustomerActive,
);

// ==========================================
// ADMIN: ACCOUNTS (ADMIN)
// ==========================================
router.get(
  "/admin/accounts",
  verifyAdmin,
  userController.getAllAccountsForAdmin,
);

router.post(
  "/admin/accounts",
  verifyAdmin,
  userController.createAccount,
);

router.patch(
  "/admin/accounts/:id/toggle-active",
  verifyAdmin,
  userController.toggleAccountActive,
);

module.exports = router;
