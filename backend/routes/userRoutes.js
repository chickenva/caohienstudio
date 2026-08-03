// Router người dùng: nhiếp ảnh gia, khách hàng và tìm kiếm admin.
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/photographers", userController.getPhotographers);
router.get("/photographers/:id", userController.getPhotographerDetail);

// ==========================================
// ADMIN: PHOTOGRAPHERS
// ==========================================
router.get(
  "/admin/photographers",
  verifyAdmin,
  userController.getAllPhotographersForAdmin,
);

router.get(
  "/admin/photographers/:id",
  verifyAdmin,
  userController.getPhotographerDetailForAdmin,
);

router.post(
  "/admin/photographers",
  verifyAdmin,
  userController.createPhotographer,
);

router.put(
  "/admin/photographers/:id",
  verifyAdmin,
  userController.updatePhotographer,
);

router.patch(
  "/admin/photographers/:id/toggle-active",
  verifyAdmin,
  userController.togglePhotographerActive,
);

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
// ADMIN: ACCOUNTS (ADMIN + PHOTOGRAPHER)
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
