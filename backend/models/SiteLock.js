/**
 * SiteLock.js
 * Model lưu trạng thái khóa website (singleton document).
 * Chỉ Super Admin mới có thể thay đổi trạng thái này.
 */
const mongoose = require('mongoose');

const siteLockSchema = new mongoose.Schema(
  {
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteLock', siteLockSchema);
