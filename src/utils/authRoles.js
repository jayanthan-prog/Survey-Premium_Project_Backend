'use strict';

const ROLE_ALIAS = {
    STUDENT: 'USER',
};

function normalizeRole(role) {
    if (!role) return null;
    const normalized = String(role).trim().toUpperCase();
    return ROLE_ALIAS[normalized] || normalized;
}

function getPrimaryRole(roles) {
    const normalizedRoles = Array.isArray(roles)
        ? roles.map(normalizeRole).filter(Boolean)
        : [];

    if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
    if (normalizedRoles.includes('APPROVER')) return 'APPROVER';
    if (normalizedRoles.includes('USER')) return 'USER';

    return normalizedRoles[0] || 'USER';
}

async function resolveUserRoles(userId) {
    const db = require('../models');
    const roles = new Set();
    const roleIds = new Set();

    if (!userId && userId !== 0) {
        return ['USER'];
    }

    try {
        const userRoles = await db.UserRole.findAll({
            where: { user_id: userId },
            raw: true,
        });

        for (const row of userRoles || []) {
            if (row.role) roles.add(normalizeRole(row.role));
            if (row.role_name) roles.add(normalizeRole(row.role_name));
            if (row.name) roles.add(normalizeRole(row.name));
            if (row.role_id) roleIds.add(row.role_id);
        }
    } catch (err) {
        // Fall back to raw queries below for schema variants.
    }

    if (roleIds.size > 0) {
        try {
            const mappedRoles = await db.Role.findAll({
                where: { role_id: Array.from(roleIds) },
                raw: true,
            });
            for (const roleRow of mappedRoles || []) {
                if (roleRow.name) roles.add(normalizeRole(roleRow.name));
            }
        } catch (err) {
            // Continue with fallback query path.
        }
    }

    if (roles.size === 0) {
        try {
            const [directRows] = await db.sequelize.query(
                'SELECT role FROM user_roles WHERE user_id = :userId',
                { replacements: { userId } }
            );
            for (const row of directRows || []) {
                if (row.role) roles.add(normalizeRole(row.role));
            }
        } catch (err) {
            // Ignore and try join fallback.
        }
    }

    if (roles.size === 0) {
        try {
            const [joinedRows] = await db.sequelize.query(
                'SELECT r.name AS role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = :userId',
                { replacements: { userId } }
            );
            for (const row of joinedRows || []) {
                if (row.role_name) roles.add(normalizeRole(row.role_name));
            }
        } catch (err) {
            // Ignore and use default below.
        }
    }

    const resolved = Array.from(roles).filter(Boolean);
    return resolved.length ? resolved : ['USER'];
}

module.exports = {
    normalizeRole,
    getPrimaryRole,
    resolveUserRoles,
};
