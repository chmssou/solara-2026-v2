/**
 * =====================================================
 * WORKFLOW SERVICE - Solar Service Lifecycle Engine
 * =====================================================
 * Central business logic for request state management.
 * All status transitions are defined and validated here.
 */

// ── Valid statuses ──────────────────────────────────────────────────────────

const INSTALLATION_STATUSES = [
    'new_request',
    'under_review',
    'site_visit_scheduled',
    'site_inspection_done',
    'quote_prepared',
    'awaiting_client_approval',
    'approved',
    'installation_scheduled',
    'in_progress',
    'completed',
    'follow_up'
];

const MAINTENANCE_STATUSES = [
    'new_request',
    'initial_diagnosis',
    'visit_scheduled',
    'in_progress',
    'resolved',
    'closed'
];

// Legacy statuses kept for backward-compatibility with existing data
const LEGACY_STATUSES = [
    'new', 'contacted', 'qualified', 'won', 'lost',
    'site_visit', 'proposal'
];

const ALL_VALID_STATUSES = [
    ...new Set([...INSTALLATION_STATUSES, ...MAINTENANCE_STATUSES, ...LEGACY_STATUSES])
];

// ── Allowed transitions (from → [to, ...]) ──────────────────────────────────

const INSTALLATION_TRANSITIONS = {
    new_request:               ['under_review'],
    under_review:              ['site_visit_scheduled', 'new_request'],
    site_visit_scheduled:      ['site_inspection_done', 'under_review'],
    site_inspection_done:      ['quote_prepared'],
    quote_prepared:            ['awaiting_client_approval'],
    awaiting_client_approval:  ['approved', 'quote_prepared'],
    approved:                  ['installation_scheduled'],
    installation_scheduled:    ['in_progress'],
    in_progress:               ['completed'],
    completed:                 ['follow_up'],
    follow_up:                 []
};

const MAINTENANCE_TRANSITIONS = {
    new_request:       ['initial_diagnosis'],
    initial_diagnosis: ['visit_scheduled', 'new_request'],
    visit_scheduled:   ['in_progress'],
    in_progress:       ['resolved'],
    resolved:          ['closed', 'in_progress'],
    closed:            []
};

// ── Request types ────────────────────────────────────────────────────────────

const REQUEST_TYPES = {
    INSTALLATION: 'installation',
    MAINTENANCE:  'maintenance'
};

// ── Human-readable labels (Arabic) ──────────────────────────────────────────

const STATUS_LABELS = {
    // Installation
    new_request:              'طلب جديد',
    under_review:             'قيد المراجعة',
    site_visit_scheduled:     'زيارة موقع مجدولة',
    site_inspection_done:     'تم معاينة الموقع',
    quote_prepared:           'تم إعداد عرض السعر',
    awaiting_client_approval: 'بانتظار موافقة العميل',
    approved:                 'موافق عليه',
    installation_scheduled:   'تركيب مجدول',
    in_progress:              'جاري التنفيذ',
    completed:                'مكتمل',
    follow_up:                'متابعة ما بعد التركيب',
    // Maintenance
    initial_diagnosis:        'التشخيص الأولي',
    visit_scheduled:          'زيارة مجدولة',
    resolved:                 'تم الحل',
    closed:                   'مغلق',
    // Legacy
    new:       'جديد',
    contacted: 'تم التواصل',
    qualified: 'مؤهل',
    won:       'مكسوب',
    lost:      'مفقود',
    site_visit:'زيارة موقع',
    proposal:  'عرض سعر'
};

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Check whether a status string is recognised.
 */
function isValidStatus(status) {
    return ALL_VALID_STATUSES.includes(status);
}

/**
 * Check whether a type string is recognised.
 */
function isValidType(type) {
    return Object.values(REQUEST_TYPES).includes(type);
}

/**
 * Validate a status→status transition for the given request type.
 * Returns { ok: true } or { ok: false, reason: '...' }.
 *
 * For legacy statuses or unknown types we allow any transition so
 * existing data is never broken.
 */
function validateTransition(currentStatus, newStatus, requestType) {
    // Always allow setting to the same status (idempotent update)
    if (currentStatus === newStatus) {
        return { ok: true };
    }

    // Legacy statuses → free transitions (backward compat)
    if (LEGACY_STATUSES.includes(currentStatus) || LEGACY_STATUSES.includes(newStatus)) {
        return { ok: true };
    }

    const map = requestType === REQUEST_TYPES.MAINTENANCE
        ? MAINTENANCE_TRANSITIONS
        : INSTALLATION_TRANSITIONS;

    const allowed = map[currentStatus];
    if (!allowed) {
        // Unknown current status → allow (graceful degradation)
        return { ok: true };
    }

    if (!allowed.includes(newStatus)) {
        return {
            ok: false,
            reason: `Cannot move from "${currentStatus}" to "${newStatus}" for ${requestType || 'installation'} requests`
        };
    }

    return { ok: true };
}

/**
 * Return the list of next valid statuses for a given current status/type.
 */
function getNextStatuses(currentStatus, requestType) {
    const map = requestType === REQUEST_TYPES.MAINTENANCE
        ? MAINTENANCE_TRANSITIONS
        : INSTALLATION_TRANSITIONS;

    return (map[currentStatus] || []).map(s => ({
        value: s,
        label: STATUS_LABELS[s] || s
    }));
}

/**
 * Return Arabic label for a status code.
 */
function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

module.exports = {
    INSTALLATION_STATUSES,
    MAINTENANCE_STATUSES,
    LEGACY_STATUSES,
    ALL_VALID_STATUSES,
    INSTALLATION_TRANSITIONS,
    MAINTENANCE_TRANSITIONS,
    REQUEST_TYPES,
    STATUS_LABELS,
    isValidStatus,
    isValidType,
    validateTransition,
    getNextStatuses,
    getStatusLabel
};
