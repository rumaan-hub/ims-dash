-- ════════════════════════════════════════════════════════════════════════
--  IMS PRODUCTION BOOTSTRAP
--  Target: empty Postgres DB (Prisma schema)
--
--  Seeds:
--    1) Three global roles in ims_roles:  SYSTEM_ADMIN, ADMIN, STAFF
--    2) Test System Admin user            (testsystemadmin@dentistry99.com)
--    3) Test Clinic Admin user            (testadmin@dentistry99.com)
--    4) Role links in ims_user_roles for both users
--
--  Both accounts use password: 12345678   (bcrypt 10 rounds)
--
--  Login at:
--    https://ims-dash.dentistry99.com
--    https://ims.dentistry99.com
--
--  Idempotent — re-running this file on a partially-seeded or fully-seeded
--  DB is safe. Existing rows get UPDATEd, missing rows get INSERTed,
--  duplicates are silently skipped via ON CONFLICT clauses.
-- ════════════════════════════════════════════════════════════════════════

-- Required for gen_random_uuid(). No-op if already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 0) SEED ROLES — global (client_id IS NULL means shared across clients)
-- ──────────────────────────────────────────────────────────────────────

-- SYSTEM_ADMIN role  (used by Test System Admin user below)
INSERT INTO ims_roles (role_id, role_name, description, is_global, client_id, created_at)
SELECT gen_random_uuid(), 'SYSTEM_ADMIN', 'Full system administrator', TRUE, NULL, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM ims_roles
    WHERE role_name = 'SYSTEM_ADMIN' AND client_id IS NULL
);

-- ADMIN role  (used by Clinic Admin users)
INSERT INTO ims_roles (role_id, role_name, description, is_global, client_id, created_at)
SELECT gen_random_uuid(), 'ADMIN', 'Clinic administrator', TRUE, NULL, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM ims_roles
    WHERE role_name = 'ADMIN' AND client_id IS NULL
);

-- STAFF role  (used by clinic staff members)
INSERT INTO ims_roles (role_id, role_name, description, is_global, client_id, created_at)
SELECT gen_random_uuid(), 'STAFF', 'Clinic staff member', TRUE, NULL, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM ims_roles
    WHERE role_name = 'STAFF' AND client_id IS NULL
);


-- ──────────────────────────────────────────────────────────────────────
-- 1) TEST SYSTEM ADMIN
--    email:    testsystemadmin@dentistry99.com
--    password: 12345678
--    redirects to /system-admin/home (because is_system_admin = TRUE)
-- ──────────────────────────────────────────────────────────────────────
WITH upserted_sysadmin AS (
    INSERT INTO "ImsUser" (
        client_id,
        company_name,
        first_name,
        last_name,
        email,
        contact_number,
        agree_to_terms,
        ims_role,
        password,
        is_system_admin,
        is_deleted,
        restore_requested,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        'Dentistry99 Corp',
        'Test',
        'SysAdmin',
        'testsystemadmin@dentistry99.com',
        NULL,
        TRUE,
        'SUPER_ADMIN',
        '$2b$10$PVeD3WyltTnfgy5KP9iE5eUfaIupGjZtF8Kaeu1OTwxwkoExvvEUO',  -- bcrypt('12345678', 10)
        TRUE,
        FALSE,
        FALSE,
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        is_system_admin = TRUE,
        ims_role        = 'SUPER_ADMIN',
        password        = EXCLUDED.password,
        is_deleted      = FALSE
    RETURNING client_id
)
INSERT INTO ims_user_roles (client_id, role_id, assigned_at)
SELECT u.client_id, r.role_id, NOW()
FROM upserted_sysadmin u
JOIN ims_roles r
  ON r.role_name = 'SYSTEM_ADMIN'
 AND r.client_id IS NULL
ON CONFLICT (client_id, role_id) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────
-- 2) TEST CLINIC ADMIN  (simple admin, NOT system admin)
--    email:    testadmin@dentistry99.com
--    password: 12345678
--    is_system_admin = FALSE  →  goes to normal IMS dashboard
-- ──────────────────────────────────────────────────────────────────────
WITH upserted_admin AS (
    INSERT INTO "ImsUser" (
        client_id,
        company_name,
        first_name,
        last_name,
        email,
        contact_number,
        agree_to_terms,
        ims_role,
        password,
        is_system_admin,
        is_deleted,
        restore_requested,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        'Dentistry99 Corp',
        'Mr',
        'Admin',
        'testadmin@dentistry99.com',
        NULL,
        TRUE,
        'ADMIN',
        '$2b$10$CLh.zXQCt5/OGaMMS4LT4.4pxPpC.Zg6ZTiH0MYTWWYjOvYwbZ/je',  -- bcrypt('12345678', 10)
        FALSE,
        FALSE,
        FALSE,
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        is_system_admin = FALSE,
        ims_role        = 'ADMIN',
        password        = EXCLUDED.password,
        is_deleted      = FALSE
    RETURNING client_id
)
INSERT INTO ims_user_roles (client_id, role_id, assigned_at)
SELECT u.client_id, r.role_id, NOW()
FROM upserted_admin u
JOIN ims_roles r
  ON r.role_name = 'ADMIN'
 AND r.client_id IS NULL
ON CONFLICT (client_id, role_id) DO NOTHING;


COMMIT;


-- ════════════════════════════════════════════════════════════════════════
--  VERIFY  (run separately after the COMMIT above)
-- ════════════════════════════════════════════════════════════════════════

-- Step 1 — confirm the 3 core roles exist
SELECT role_id, role_name, description, is_global, client_id, created_at
FROM ims_roles
WHERE role_name IN ('SYSTEM_ADMIN', 'ADMIN', 'STAFF')
  AND client_id IS NULL
ORDER BY role_name;

-- Step 2 — confirm both users exist
SELECT
    client_id,
    email,
    company_name,
    first_name,
    last_name,
    ims_role,
    is_system_admin,
    is_deleted,
    created_at
FROM "ImsUser"
WHERE email IN ('testsystemadmin@dentistry99.com', 'testadmin@dentistry99.com')
ORDER BY is_system_admin DESC;

-- Step 3 — confirm role links (should return exactly 2 rows)
SELECT
    u.email,
    r.role_name,
    r.is_global,
    ur.assigned_at
FROM ims_user_roles ur
JOIN "ImsUser"  u ON u.client_id = ur.client_id
JOIN ims_roles  r ON r.role_id   = ur.role_id
WHERE u.email IN ('testsystemadmin@dentistry99.com', 'testadmin@dentistry99.com')
ORDER BY r.role_name;
