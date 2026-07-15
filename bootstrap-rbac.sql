-- ════════════════════════════════════════════════════════════════════════
--  IMS RBAC BOOTSTRAP — production seed for permissions & role mappings
--
--  Run AFTER `bootstrap-admins.sql` (which seeds SYSTEM_ADMIN / ADMIN /
--  STAFF roles + the two test users).
--
--  Why this file exists:
--    The frontend sidebar gates each menu item on `hasPermission(...)`.
--    Without rows in `ims_permissions` AND `ims_role_permissions`, every
--    permission check fails and the sidebar renders only the few items
--    that have no permission gate (Dashboard, Tracking, Suggestion,
--    Profile). That is exactly the symptom you are seeing right now.
--
--  This file:
--    1) Cleans up 3 leftover debug rows (test.verify.db_*) in ims_permissions.
--    2) UPSERTs the 14 real permissions the codebase actually checks
--       (13 from frontend `usePermissions.ts` + `demo.manage` from backend).
--    3) Links every permission to SYSTEM_ADMIN and ADMIN roles
--       (so testadmin@dentistry99.com gets full sidebar).
--    4) Links a read-only subset to STAFF role
--       (inventory.view, ledger.view, staff.view, purchase.view).
--
--  Idempotent — safe to re-run. Uses ON CONFLICT DO NOTHING throughout.
-- ════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 0) CLEANUP — remove debug rows left over from earlier verification
--    These have name like 'test.verify.db_<timestamp>' and module = 'test'.
--    Removing them first means the role-permission JOINs below are clean.
-- ──────────────────────────────────────────────────────────────────────
DELETE FROM ims_role_permissions
WHERE permission_id IN (
    SELECT permission_id FROM ims_permissions WHERE module = 'test'
);

DELETE FROM ims_permissions
WHERE module = 'test';


-- ──────────────────────────────────────────────────────────────────────
-- 1) PERMISSIONS — UPSERT the 14 real permissions used in the codebase
--    Source of truth: ims-dash/hooks/usePermissions.ts (PermissionString type)
--                   + dentistry99Backend/**/*.controller.ts @Permissions(...)
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO ims_permissions (permission_id, name, module, created_at) VALUES
    (gen_random_uuid(), 'inventory.view',   'Inventory', NOW()),
    (gen_random_uuid(), 'inventory.create', 'Inventory', NOW()),
    (gen_random_uuid(), 'inventory.edit',   'Inventory', NOW()),
    (gen_random_uuid(), 'inventory.delete', 'Inventory', NOW()),
    (gen_random_uuid(), 'ledger.view',      'Ledger',    NOW()),
    (gen_random_uuid(), 'staff.view',       'Staff',     NOW()),
    (gen_random_uuid(), 'staff.manage',     'Staff',     NOW()),
    (gen_random_uuid(), 'purchase.view',    'Purchase',  NOW()),
    (gen_random_uuid(), 'purchase.create',  'Purchase',  NOW()),
    (gen_random_uuid(), 'transfer.create',  'Transfer',  NOW()),
    (gen_random_uuid(), 'office.manage',    'Offices',   NOW()),
    (gen_random_uuid(), 'roles.view',       'Roles',     NOW()),
    (gen_random_uuid(), 'roles.manage',     'Roles',     NOW()),
    (gen_random_uuid(), 'demo.manage',      'Demo',      NOW())
ON CONFLICT (name) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────
-- 2) ROLE → PERMISSION LINKS — SYSTEM_ADMIN gets ALL 14 permissions
--    (defence in depth — the JWT bypass already exists, but if any
--     guard ever changes its mind, the row-level RBAC still works.)
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO ims_role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM ims_roles r
CROSS JOIN ims_permissions p
WHERE r.role_name = 'SYSTEM_ADMIN'
  AND r.client_id IS NULL
  AND p.module <> 'test'
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────
-- 3) ROLE → PERMISSION LINKS — ADMIN gets ALL 14 permissions
--    This is what unblocks the testadmin@dentistry99.com sidebar.
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO ims_role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM ims_roles r
CROSS JOIN ims_permissions p
WHERE r.role_name = 'ADMIN'
  AND r.client_id IS NULL
  AND p.module <> 'test'
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────
-- 4) ROLE → PERMISSION LINKS — STAFF gets read-only subset
--    Staff can see inventory/ledger/staff/purchase but cannot mutate.
--    Edit, create, delete, transfer, office.manage and roles.* are
--    intentionally NOT granted to STAFF.
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO ims_role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM ims_roles r
JOIN ims_permissions p
  ON p.name IN ('inventory.view', 'ledger.view', 'staff.view', 'purchase.view')
WHERE r.role_name = 'STAFF'
  AND r.client_id IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;


COMMIT;


-- ════════════════════════════════════════════════════════════════════════
--  VERIFY  (run separately after the COMMIT above)
-- ════════════════════════════════════════════════════════════════════════

-- Step 1 — confirm exactly 14 real permissions exist (no test.* rows)
SELECT module, name, created_at
FROM ims_permissions
ORDER BY module, name;

-- Step 2 — confirm role links: SYSTEM_ADMIN=14, ADMIN=14, STAFF=4
SELECT
    r.role_name,
    COUNT(rp.permission_id) AS permission_count,
    string_agg(p.name, ', ' ORDER BY p.name) AS permissions
FROM ims_roles r
LEFT JOIN ims_role_permissions rp ON rp.role_id = r.role_id
LEFT JOIN ims_permissions      p  ON p.permission_id = rp.permission_id
WHERE r.client_id IS NULL
  AND r.role_name IN ('SYSTEM_ADMIN', 'ADMIN', 'STAFF')
GROUP BY r.role_name
ORDER BY r.role_name;

-- Step 3 — sanity check what the testadmin user will resolve to
--          (this is what /ims/rbac/my-permissions returns from the DB path)
SELECT DISTINCT p.name
FROM "ImsUser" u
JOIN ims_user_roles      ur ON ur.client_id     = u.client_id
JOIN ims_roles           r  ON r.role_id        = ur.role_id
JOIN ims_role_permissions rp ON rp.role_id      = r.role_id
JOIN ims_permissions     p  ON p.permission_id = rp.permission_id
WHERE u.email = 'testadmin@dentistry99.com'
ORDER BY p.name;
