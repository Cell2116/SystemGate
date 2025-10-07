-- ═══════════════════════════════════════════════════════════════════════
-- HIKVISION IVMS - QUICK SQL REFERENCE
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- 1. MONITORING QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Check unprocessed records
SELECT COUNT(*) as pending_count 
FROM attlog 
WHERE processed = 0 OR processed IS NULL;

-- View recent unprocessed records
SELECT TOP 20 
    id, employeeID, personName, authDateTime, 
    cardNo, processed, status
FROM attlog 
WHERE processed = 0 OR processed IS NULL
ORDER BY authDateTime DESC;

-- View processed records today
SELECT 
    id, employeeID, personName, authDateTime, 
    cardNo, processed, status
FROM attlog 
WHERE processed = 1 
  AND CAST(authDateTime AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY authDateTime DESC;

-- Count processing status
SELECT 
    status, 
    COUNT(*) as count
FROM attlog
WHERE CAST(authDateTime AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY status
ORDER BY count DESC;

-- ───────────────────────────────────────────────────────────────────────
-- 2. TESTING QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Insert test ENTRY
INSERT INTO attlog (
    employeeID, authDateTime, authDate, authTime, 
    direction, deviceName, deviceSN, personName, cardNo, 
    processed, status
) VALUES (
    'EMP001',                    -- employeeID (must exist in users.uid)
    GETDATE(),                   -- authDateTime
    CAST(GETDATE() AS DATE),     -- authDate
    CAST(GETDATE() AS TIME),     -- authTime
    'in',                        -- direction
    'Main Gate',                 -- deviceName
    'HKV001',                    -- deviceSN
    'John Doe',                  -- personName
    'B1234ABC',                  -- cardNo (license plate)
    0,                           -- processed (0 = not processed)
    NULL                         -- status
);

-- Insert test EXIT (setelah 5 detik)
WAITFOR DELAY '00:00:05';
INSERT INTO attlog (
    employeeID, authDateTime, authDate, authTime, 
    direction, deviceName, deviceSN, personName, cardNo, 
    processed, status
) VALUES (
    'EMP001', GETDATE(), CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME),
    'out', 'Main Gate', 'HKV001', 'John Doe', 'B1234ABC', 0, NULL
);

-- ───────────────────────────────────────────────────────────────────────
-- 3. DEBUGGING QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Check employee exists in users table
SELECT * FROM users WHERE uid = 'EMP001';

-- Check today's attendance for employee
SELECT 
    al.*,
    lp.reason as leave_reason,
    lp.exittime as planned_exit,
    lp.returntime as planned_return
FROM attendance_logs al
LEFT JOIN leave_permission lp ON al.leave_permission_id = lp.id
WHERE al.uid = 'EMP001'
  AND CAST(al.datein AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY al.datein DESC;

-- Check active leave permissions
SELECT * 
FROM leave_permission
WHERE licenseplate = 'B1234ABC'
  AND date = CAST(GETDATE() AS DATE)
  AND statusfromhr = 'approved'
  AND statusfromdept = 'approved'
ORDER BY exittime;

-- ───────────────────────────────────────────────────────────────────────
-- 4. CLEANUP QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Reset processed flag (untuk re-process)
UPDATE attlog 
SET processed = 0, status = NULL
WHERE CAST(authDateTime AS DATE) = CAST(GETDATE() AS DATE);

-- Delete test data
DELETE FROM attlog 
WHERE employeeID IN ('EMP001', 'EMP002', 'EMP003');

-- Delete old processed records (keep 30 days)
DELETE FROM attlog
WHERE processed = 1
  AND authDateTime < DATEADD(DAY, -30, GETDATE());

-- ───────────────────────────────────────────────────────────────────────
-- 5. PERFORMANCE QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Check index usage
SELECT 
    OBJECT_NAME(s.object_id) AS table_name,
    i.name AS index_name,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) = 'attlog'
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;

-- Check table size
SELECT 
    t.name AS table_name,
    p.rows AS row_count,
    SUM(a.total_pages) * 8 AS total_space_kb,
    SUM(a.used_pages) * 8 AS used_space_kb
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.name = 'attlog'
GROUP BY t.name, p.rows;

-- ───────────────────────────────────────────────────────────────────────
-- 6. REPORTING QUERIES
-- ───────────────────────────────────────────────────────────────────────

-- Daily summary
SELECT 
    CAST(authDateTime AS DATE) as date,
    COUNT(*) as total_taps,
    COUNT(CASE WHEN processed = 1 THEN 1 END) as processed,
    COUNT(CASE WHEN processed = 0 THEN 1 END) as pending
FROM attlog
WHERE authDateTime >= DATEADD(DAY, -7, GETDATE())
GROUP BY CAST(authDateTime AS DATE)
ORDER BY date DESC;

-- Employee activity today
SELECT 
    a.employeeID,
    a.personName,
    COUNT(*) as tap_count,
    MIN(a.authDateTime) as first_tap,
    MAX(a.authDateTime) as last_tap,
    STRING_AGG(a.status, ' → ') as status_flow
FROM attlog a
WHERE CAST(a.authDateTime AS DATE) = CAST(GETDATE() AS DATE)
  AND a.processed = 1
GROUP BY a.employeeID, a.personName
ORDER BY first_tap;

-- Leave usage report
SELECT 
    lp.name,
    lp.licenseplate,
    lp.department,
    lp.exittime as planned_exit,
    lp.returntime as planned_return,
    lp.actual_exittime,
    lp.actual_returntime,
    lp.reason,
    CASE 
        WHEN lp.actual_exittime IS NULL THEN 'Not started'
        WHEN lp.actual_returntime IS NULL THEN 'On leave'
        ELSE 'Completed'
    END as leave_status
FROM leave_permission lp
WHERE lp.date = CAST(GETDATE() AS DATE)
  AND lp.statusfromhr = 'approved'
  AND lp.statusfromdept = 'approved'
ORDER BY lp.exittime;

-- ───────────────────────────────────────────────────────────────────────
-- 7. TROUBLESHOOTING
-- ───────────────────────────────────────────────────────────────────────

-- Find stuck records (processed but no status)
SELECT * FROM attlog
WHERE processed = 1 AND status IS NULL
ORDER BY authDateTime DESC;

-- Find error records
SELECT * FROM attlog
WHERE status LIKE 'error%'
ORDER BY authDateTime DESC;

-- Find records with unknown users
SELECT * FROM attlog
WHERE status = 'user_not_found'
ORDER BY authDateTime DESC;

-- Check duplicate processing
SELECT 
    employeeID, 
    authDateTime, 
    COUNT(*) as duplicate_count
FROM attlog
WHERE processed = 1
GROUP BY employeeID, authDateTime
HAVING COUNT(*) > 1;

-- ───────────────────────────────────────────────────────────────────────
-- 8. MAINTENANCE
-- ───────────────────────────────────────────────────────────────────────

-- Rebuild indexes
ALTER INDEX idx_attlog_processed ON attlog REBUILD;
ALTER INDEX idx_attlog_employeeid ON attlog REBUILD;
ALTER INDEX idx_attlog_datetime ON attlog REBUILD;

-- Update statistics
UPDATE STATISTICS attlog;

-- Check fragmentation
SELECT 
    OBJECT_NAME(ps.object_id) AS table_name,
    i.name AS index_name,
    ps.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('attlog'), NULL, NULL, 'LIMITED') ps
INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent > 10
ORDER BY ps.avg_fragmentation_in_percent DESC;

-- ═══════════════════════════════════════════════════════════════════════
