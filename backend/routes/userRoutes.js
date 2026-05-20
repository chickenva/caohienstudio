const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

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
  verifyToken,
  userController.getAllPhotographersForAdmin,
);

router.get(
  "/admin/photographers/:id",
  verifyToken,
  userController.getPhotographerDetailForAdmin,
);

router.post(
  "/admin/photographers",
  verifyToken,
  userController.createPhotographer,
);

router.put(
  "/admin/photographers/:id",
  verifyToken,
  userController.updatePhotographer,
);

router.patch(
  "/admin/photographers/:id/toggle-active",
  verifyToken,
  userController.togglePhotographerActive,
);

// ==========================================
// ADMIN: CUSTOMERS
// ==========================================
router.get(
  "/admin/customers",
  verifyToken,
  userController.getAllCustomersForAdmin,
);

router.get(
  "/admin/customers/:id",
  verifyToken,
  userController.getCustomerDetailForAdmin,
);

router.patch(
  "/admin/customers/:id/toggle-active",
  verifyToken,
  userController.toggleCustomerActive,
);

module.exports = router;
