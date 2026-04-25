/**
 * =====================================================
 * SERVICE REQUESTS ROUTES
 * =====================================================
 * All routes are protected by verifyToken.
 * Write operations (status changes, notes, assign) require admin.
 * Read operations and creation work for both roles.
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/serviceRequestController');

// ── Create (guest or authenticated) ────────────────────────────────────────
router.post('/', optionalAuth, ctrl.createRequest);

// All management routes require at least a valid token
router.use(verifyToken);

// ── Read (both admin and client) ───────────────────────────────────────────
router.get('/',          ctrl.listRequests);
router.get('/stats',     ctrl.getStats);        // admin dashboard usage
router.get('/:id',       ctrl.getRequest);
router.get('/:id/timeline', ctrl.getTimeline);


// ── Mutations (admin only) ─────────────────────────────────────────────────
router.patch('/:id/status', requireAdmin, ctrl.updateStatus);
router.put('/:id/assign', requireAdmin, ctrl.assignRequest);
router.put('/:id/notes',  requireAdmin, ctrl.updateInternalNotes);
router.delete('/:id',     requireAdmin, ctrl.deleteRequest);

module.exports = router;
