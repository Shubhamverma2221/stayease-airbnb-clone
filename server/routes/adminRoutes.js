const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  toggleBlockUser,
  approveHost,
  toggleApproveProperty,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getUsers);
router.put('/users/:id/block', toggleBlockUser);
router.put('/users/:id/approve-host', approveHost);
router.put('/properties/:id/approve', toggleApproveProperty);

module.exports = router;
