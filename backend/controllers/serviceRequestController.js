/**
 * =====================================================
 * SERVICE REQUESTS CONTROLLER
 * =====================================================
 * Handles the unified installation / maintenance workflow.
 * All DB calls go through dbService (async/await).
 * All business rules go through workflowService.
 */

const { dbGet, dbAll, dbRun } = require('../services/dbService');
const {
    REQUEST_TYPES,
    validateTransition,
    getNextStatuses,
    getStatusLabel,
    isValidStatus,
    isValidType,
    ALL_VALID_STATUSES
} = require('../services/workflowService');
const {
    validateServiceRequest,
    validateStatusUpdate,
    sanitizeString
} = require('../services/validationService');
const { sendStatusEmail } = require('../services/emailService');

// ── GET /api/requests ──────────────────────────────────────────────────────

const listRequests = async (req, res) => {
    try {
        const { type, status, assigned_to, page = 1, limit = 50 } = req.query;

        let sql = 'SELECT sr.*, u.name AS assigned_name FROM service_requests sr LEFT JOIN users u ON sr.assigned_to = u.id WHERE 1=1';
        const params = [];

        if (type && isValidType(type)) {
            sql += ' AND sr.request_type = ?';
            params.push(type);
        }

        if (status && isValidStatus(status)) {
            sql += ' AND sr.status = ?';
            params.push(status);
        }

        if (assigned_to) {
            sql += ' AND sr.assigned_to = ?';
            params.push(assigned_to);
        }

        // Clients only see their own requests
        if (req.user.role === 'client') {
            sql += ' AND sr.user_id = ?';
            params.push(req.user.id);
        }

        sql += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const rows = await dbAll(sql, params);

        // Enrich each row with a label and allowed next statuses
        const enriched = rows.map(r => ({
            ...r,
            status_label: getStatusLabel(r.status),
            next_statuses: getNextStatuses(r.status, r.request_type)
        }));

        res.json({ success: true, requests: enriched, count: enriched.length });
    } catch (err) {
        console.error('listRequests error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ── GET /api/requests/stats ────────────────────────────────────────────────

const getStats = async (req, res) => {
    try {
        // Overall totals
        const [total, installations, maintenances] = await Promise.all([
            dbGet('SELECT COUNT(*) AS c FROM service_requests', []),
            dbGet("SELECT COUNT(*) AS c FROM service_requests WHERE request_type='installation'", []),
            dbGet("SELECT COUNT(*) AS c FROM service_requests WHERE request_type='maintenance'", [])
        ]);

        // Per-status breakdown
        const byStatus = await dbAll(
            'SELECT status, COUNT(*) AS c FROM service_requests GROUP BY status', []
        );
        const statusBreakdown = {};
        byStatus.forEach(r => { statusBreakdown[r.status] = r.c; });

        // Monthly for chart (last 6 months)
        const monthly = await dbAll(`
            SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
            FROM service_requests
            WHERE created_at >= date('now', '-6 months')
            GROUP BY month
            ORDER BY month ASC
        `, []);

        res.json({
            success: true,
            stats: {
                total: total.c,
                installations: installations.c,
                maintenances: maintenances.c,
                statusBreakdown,
                monthlyRequests: monthly
            }
        });
    } catch (err) {
        console.error('getStats error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ── GET /api/requests/:id ──────────────────────────────────────────────────

const getRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const request = await dbGet(
            'SELECT sr.*, u.name AS assigned_name FROM service_requests sr LEFT JOIN users u ON sr.assigned_to = u.id WHERE sr.id = ?',
            [id]
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Clients can only see their own requests
        if (req.user.role === 'client' && request.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const history = await dbAll(
            'SELECT sh.*, u.name AS changed_by_name FROM status_history sh LEFT JOIN users u ON sh.changed_by = u.id WHERE sh.request_id = ? ORDER BY sh.created_at ASC',
            [id]
        );

        const enriched = {
            ...request,
            status_label: getStatusLabel(request.status),
            next_statuses: getNextStatuses(request.status, request.request_type),
            timeline: history.map(h => ({
                ...h,
                from_label: getStatusLabel(h.from_status),
                to_label:   getStatusLabel(h.to_status)
            }))
        };

        // Strip internal_notes for clients
        if (req.user.role === 'client') {
            delete enriched.internal_notes;
        }

        res.json({ success: true, request: enriched });
    } catch (err) {
        console.error('getRequest error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ── POST /api/requests ─────────────────────────────────────────────────────

const createRequest = async (req, res) => {
    try {
        const validation = validateServiceRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const {
            request_type = REQUEST_TYPES.INSTALLATION,
            name,
            email = '',
            phone = '',
            address = '',
            description = ''
        } = req.body;

        const { lastID } = await dbRun(
            `INSERT INTO service_requests
                (request_type, name, email, phone, address, description, status, user_id)
             VALUES (?, ?, ?, ?, ?, ?, 'new_request', ?)`,
            [
                request_type,
                sanitizeString(name),
                sanitizeString(email),
                sanitizeString(phone),
                sanitizeString(address),
                sanitizeString(description, 2000),
                req.user ? req.user.id : null
            ]
        );

        // Seed first status history entry
        await dbRun(
            'INSERT INTO status_history (request_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
            [lastID, null, 'new_request', req.user ? req.user.id : null, 'طلب جديد']
        );

        const created = await dbGet('SELECT * FROM service_requests WHERE id = ?', [lastID]);

        res.status(201).json({
            success: true,
            message: 'Service request created successfully',
            request: { ...created, status_label: getStatusLabel(created.status) }
        });
    } catch (err) {
        console.error('createRequest error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create service request' });
    }
};

// ── PUT /api/requests/:id/status ──────────────────────────────────────────

const updateStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, note = '' } = req.body;

        const validation = validateStatusUpdate(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const request = await dbGet('SELECT * FROM service_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Validate lifecycle transition
        const check = validateTransition(request.status, status, request.request_type);
        if (!check.ok) {
            return res.status(422).json({ success: false, message: check.reason });
        }

        await dbRun(
            "UPDATE service_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [status, id]
        );

        await dbRun(
            'INSERT INTO status_history (request_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
            [id, request.status, status, req.user.id, sanitizeString(note, 1000)]
        );

        // Send email notification non-blocking so it doesn't break the response
        if (request.email) {
            sendStatusEmail(request.email, request.name, request.request_type, status)
                .catch(err => console.error("Non-fatal email error:", err));
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            from: request.status,
            to: status,
            to_label: getStatusLabel(status),
            next_statuses: getNextStatuses(status, request.request_type)
        });
    } catch (err) {
        console.error('updateStatus error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

// ── PUT /api/requests/:id/assign ──────────────────────────────────────────

const assignRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const { assigned_to } = req.body;

        if (!assigned_to) {
            return res.status(400).json({ success: false, message: 'assigned_to is required' });
        }

        const request = await dbGet('SELECT id FROM service_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const user = await dbGet('SELECT id, name FROM users WHERE id = ?', [assigned_to]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await dbRun(
            'UPDATE service_requests SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [assigned_to, id]
        );

        res.json({ success: true, message: `Request assigned to ${user.name}` });
    } catch (err) {
        console.error('assignRequest error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to assign request' });
    }
};

// ── PUT /api/requests/:id/notes ───────────────────────────────────────────

const updateInternalNotes = async (req, res) => {
    try {
        const id = req.params.id;
        const { internal_notes = '' } = req.body;

        const request = await dbGet('SELECT id FROM service_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        await dbRun(
            'UPDATE service_requests SET internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [sanitizeString(internal_notes, 5000), id]
        );

        res.json({ success: true, message: 'Internal notes updated' });
    } catch (err) {
        console.error('updateInternalNotes error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update notes' });
    }
};

// ── DELETE /api/requests/:id ──────────────────────────────────────────────

const deleteRequest = async (req, res) => {
    try {
        const id = req.params.id;

        const request = await dbGet('SELECT id FROM service_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        await dbRun('DELETE FROM status_history WHERE request_id = ?', [id]);
        await dbRun('DELETE FROM service_requests WHERE id = ?', [id]);

        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (err) {
        console.error('deleteRequest error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to delete request' });
    }
};

// ── GET /api/requests/:id/timeline ────────────────────────────────────────

const getTimeline = async (req, res) => {
    try {
        const id = req.params.id;

        const request = await dbGet('SELECT id, user_id, request_type FROM service_requests WHERE id = ?', [id]);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (req.user.role === 'client' && request.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const history = await dbAll(
            `SELECT sh.*, u.name AS changed_by_name
             FROM status_history sh
             LEFT JOIN users u ON sh.changed_by = u.id
             WHERE sh.request_id = ?
             ORDER BY sh.created_at ASC`,
            [id]
        );

        const timeline = history.map(h => ({
            ...h,
            from_label: getStatusLabel(h.from_status),
            to_label:   getStatusLabel(h.to_status)
        }));

        res.json({ success: true, request_id: id, timeline });
    } catch (err) {
        console.error('getTimeline error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

module.exports = {
    listRequests,
    getStats,
    getRequest,
    createRequest,
    updateStatus,
    assignRequest,
    updateInternalNotes,
    deleteRequest,
    getTimeline
};
