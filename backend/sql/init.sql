
-- SQL SERVER VERSION


-- SQL Server Schema untuk database thirdparty

USE thirdparty;
GO

-- !! HIKVISION IVMS TABLE
-- Table attlog from Hikvision IVMS (third party database)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[attlog]') AND type in (N'U'))
BEGIN
    CREATE TABLE attlog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        employeeID VARCHAR(50) NOT NULL,
        authDateTime DATETIME2 NOT NULL,
        authDate DATE,
        authTime TIME,
        direction VARCHAR(10), -- 'in' or 'out'
        deviceName VARCHAR(100),
        deviceSN VARCHAR(100),
        personName NVARCHAR(255),
        cardNo VARCHAR(50),
        processed BIT DEFAULT 0,
        status VARCHAR(255)
    );
    
    -- Index untuk performance polling
    CREATE INDEX idx_attlog_processed ON attlog(processed, authDateTime);
    CREATE INDEX idx_attlog_employeeid ON attlog(employeeID);
    CREATE INDEX idx_attlog_datetime ON attlog(authDateTime);
END
GO
-- ===========================================
--  DATABASE STRUCTURE FOR LEAVE APPROVAL SYSTEM
-- ===========================================
-- ===========================================
-- 1️⃣ TABLE: USER LOGIN
-- ===========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[userlogin]') AND type in (N'U'))
BEGIN
    CREATE TABLE userlogin (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(MAX) NOT NULL,
        username NVARCHAR(MAX) NOT NULL,
        password VARCHAR(255) NOT NULL,
        department VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL
    );
END
GO

-- ===========================================
-- 2️⃣ TABLE: USERS (RFID USERS)
-- ===========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(MAX) NOT NULL,
        uid VARCHAR(50) UNIQUE NOT NULL,
        licenseplate VARCHAR(50),
        department VARCHAR(50) NOT NULL,
        no_telp VARCHAR(50),
        role VARCHAR(50) NOT NULL
    );
END
GO

-- ===========================================
-- 3️⃣ TABLE: MASTER ROUTING APPROVAL (KOLUMN-BASED)
-- ===========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[master_routing]') AND type in (N'U'))
BEGIN
    CREATE TABLE master_routing (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        employee_name NVARCHAR(100) NULL,         -- optional, kalau ingin routing spesifik per nama
        role NVARCHAR(100) NOT NULL,              -- contoh: STAFF, HEAD DEPARTMENT, HR

        -- Approval Levels (kolom-based)
        approval_level1_name NVARCHAR(100) NULL,
        approval_level1_role NVARCHAR(100) NULL,
        approval_level2_name NVARCHAR(100) NULL,
        approval_level2_role NVARCHAR(100) NULL,
        approval_level3_name NVARCHAR(100) NULL,
        approval_level3_role NVARCHAR(100) NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT SYSDATETIME(),
        updated_at DATETIME2 DEFAULT SYSDATETIME()
    );
END
GO

-- ===========================================
-- 4️⃣ TABLE: LEAVE PERMISSION
-- ===========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[leave_permission]') AND type in (N'U'))
BEGIN
    CREATE TABLE leave_permission (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(MAX) NOT NULL,
        uid VARCHAR(50),
        licenseplate VARCHAR(50),
        department VARCHAR(50),
        role VARCHAR(50),
        date DATE,
        exittime DATETIME2,
        returntime DATETIME2,
        actual_exittime DATETIME2,
        actual_returntime DATETIME2,
        reason VARCHAR(255),
        approval VARCHAR(50),
        statusfromhr VARCHAR(50),
        statusfromdept VARCHAR(50),
        statusfromdirector VARCHAR(50),
        submittedat DATETIME2,
        current_approval_level INT DEFAULT 1,
        total_approval_levels INT,
        is_completed BIT DEFAULT 0,
        final_status VARCHAR(20)
    );
END
GO

-- Tambahkan kolom routing_id jika belum ada
IF COL_LENGTH('leave_permission', 'routing_id') IS NULL
BEGIN
    ALTER TABLE leave_permission
    ADD routing_id INT NULL
        CONSTRAINT FK_leave_permission_routing
        FOREIGN KEY REFERENCES master_routing(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
END
GO

-- ===========================================
-- 5️⃣ TABLE: ATTENDANCE LOGS
-- ===========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[attendance_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE attendance_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        uid VARCHAR(50),
        licenseplate VARCHAR(50),
        image_path NVARCHAR(MAX),
        image_path_out NVARCHAR(MAX),
        image_path_leave_exit VARCHAR(255),
        image_path_leave_return VARCHAR(255),
        datein DATETIME2 DEFAULT GETDATE(),
        dateout DATETIME2,
        exitTime DATETIME2,
        returnTime DATETIME2,
        actual_exittime DATETIME2,
        actual_returntime DATETIME2,
        status NVARCHAR(MAX),
        leave_permission_id INT FOREIGN KEY REFERENCES leave_permission(id)
    );
END
GO


IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[approval_tracking]') AND type in (N'U'))
BEGIN
    CREATE TABLE approval_tracking (
        id INT IDENTITY(1,1) PRIMARY KEY,
        leave_permission_id INT NOT NULL,
        approval_level INT NOT NULL, -- 1, 2, 3
        approver_name NVARCHAR(100),
        approver_role NVARCHAR(100),
        status VARCHAR(20), -- pending, approved, rejected
        approved_at DATETIME2,
        approved_by NVARCHAR(100), -- actual approver name
        notes TEXT,
        FOREIGN KEY (leave_permission_id) REFERENCES leave_permission(id)
    );
END
GO



-- ===========================================
-- 6️⃣ TRIGGER: AUTO UPDATE TIMESTAMP ON MASTER_ROUTING UPDATE
-- ===========================================
IF OBJECT_ID('trg_update_master_routing', 'TR') IS NOT NULL
    DROP TRIGGER trg_update_master_routing;
GO

CREATE TRIGGER trg_update_master_routing
ON master_routing
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE master_routing
    SET updated_at = SYSDATETIME()
    FROM inserted i
    WHERE master_routing.id = i.id;
END;
GO

-- ===========================================
-- 7️⃣ SAMPLE DATA FOR MASTER ROUTING
-- ===========================================
-- Routing untuk IT Department
INSERT INTO master_routing (department, employee_name, role, approval_level1_name, approval_level1_role, approval_level2_name, approval_level2_role)
VALUES
('IT', NULL, 'Staff', 'Maksudi Indra Rukmana', 'Head Department', 'MIA PUTRI NURDIANTI', 'HR');
-- Routing untuk HR Department (umum)
INSERT INTO master_routing (department, employee_name, role, approval_level1_name, approval_level1_role, approval_level2_name, approval_level2_role)
VALUES
('HR', NULL, 'STAFF', 'DERMAWAN PURBA', 'HEAD DEPARTMENT', 'Siti Romlah', 'HR');
-- Routing khusus HR (berdasarkan nama)
INSERT INTO master_routing (department, employee_name, role, approval_level1_name, approval_level1_role, approval_level2_name, approval_level2_role)
VALUES
('HR', 'MIA PUTRI NURDIANTI', 'HR', 'DERMAWAN PURBA', 'HEAD DEPARTMENT', 'MIA PUTRI NURDIANTI', 'HR'),
('HR', 'SAEPUDIN M IKHSAN', 'HR', 'DERMAWAN PURBA', 'HEAD DEPARTMENT', 'Siti Romlah', 'HR'),
('HR', 'Siti Romlah', 'HR', 'DERMAWAN PURBA', 'HEAD DEPARTMENT', 'Siti Romlah', 'HR');
-- Routing untuk Finance Department
INSERT INTO master_routing (department, employee_name, role, approval_level1_name, approval_level1_role, approval_level2_name, approval_level2_role)
VALUES
('Finance', NULL, 'STAFF', 'JONATHAN', 'HEAD DEPARTMENT', 'MIA PUTRI NURDIANTI', 'HR');
GO



IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[truck_queue_actual]') AND type = N'U')
BEGIN
    CREATE TABLE truck_queue_actual (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department VARCHAR(50),
        truck_id INT FOREIGN KEY REFERENCES trucks(id) ON DELETE CASCADE,
        queue_position INT,
        queue_ticket INT NULL,
        last_update DATETIME2 DEFAULT GETDATE()
    );
END
GO


IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND type = N'U')
BEGIN
    CREATE TABLE trucks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        platenumber VARCHAR(50),
        noticket VARCHAR(50),
        department VARCHAR(50),
        nikdriver VARCHAR(50),
        tlpdriver VARCHAR(50),
        nosj VARCHAR(50),
        tglsj DATE,
        driver VARCHAR(50),
        supplier VARCHAR(50),
        eta VARCHAR(50),
        status VARCHAR(50),
        type VARCHAR(50),
        operation VARCHAR(20) CHECK (operation IN ('bongkar', 'muat')),
        goods VARCHAR(50),
        descin VARCHAR(200),
        descout VARCHAR(200),
        statustruck VARCHAR(50),
        armada VARCHAR(50),
        kelengkapan VARCHAR(50),
        jenismobil VARCHAR(50),
        jenisbarang VARCHAR(50),
        date DATE,
        skipped_steps VARCHAR(255) NULL,
        skip_reason VARCHAR(255) NULL,
        loading_cycle VARCHAR(255) NULL,
        department_history VARCHAR(255) NULL,
    );
END
GO

-- IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[truck_queue]') AND type = N'U')
-- BEGIN
--     CREATE TABLE truck_queue_actual (
--         id INT IDENTITY(1,1) PRIMARY KEY,
--         truck_id INT FOREIGN KEY REFERENCES trucks(id) ON DELETE CASCADE,
--         department VARCHAR(50),
--         step_status VARCHAR(50),
--         position_order INT,
--         ready_flag BIT DEFAULT 1,
--         updated_at DATETIME2 DEFAULT SYSDATETIME()
--     );
-- END
-- GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[truck_times]') AND type = N'U')
BEGIN
    CREATE TABLE truck_times (
        id INT IDENTITY(1,1) PRIMARY KEY,
        truck_id INT FOREIGN KEY REFERENCES trucks(id) ON DELETE CASCADE,
        arrivaltime DATETIME2,
        waitingfortimbang TIME,
        starttimbang TIME,
        finishtimbang TIME,
        totalprocesstimbang TIME,
        runtohpc TIME,  
        waitingforarrivalhpc TIME,
        entryhpc TIME,
        runtopt TIME,
        waitingforarrivalpt TIME,
        entrypt TIME,
        totalwaitingarrival TIME,
        startloadingtime TIME,
        finishloadingtime TIME,
        totalprocessloadingtime TIME,
        actualwaitloadingtime TIME,
        starttimbangneto TIME,
        finishtimbangneto TIME,
        totalprocesstimbangneto TIME, 
        waitingfortimbangneto TIME,
        exittime TIME,
        totaltruckcompletiontime VARCHAR(10),
        -- totaltruckcompletiontime TIME, -> Change to Varchar SQL SERVER Limitation
        waitingforexit DATETIME2,
        cycle_number INT DEFAULT 1
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[truck_photos]') AND type = N'U')
BEGIN
    CREATE TABLE truck_photos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        truck_id INT FOREIGN KEY REFERENCES trucks(id) ON DELETE CASCADE,
        driver_photo VARCHAR(255),
        stnk_photo VARCHAR(255),
        sim_photo VARCHAR(255)
    );
END
GO


CREATE OR ALTER PROCEDURE sp_update_truck_queue_actual
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH latest_times AS (
        SELECT *,
            ROW_NUMBER() OVER (PARTITION BY truck_id ORDER BY id DESC) AS rn
        FROM truck_times
    ),
    current_step AS (
        SELECT
            t.id AS truck_id,
            t.platenumber,
            t.department,
            t.status,
            tt.arrivaltime,
            tt.starttimbang,
            tt.finishtimbang,
            tt.startloadingtime,
            tt.finishloadingtime,
            tt.starttimbangneto,
            tt.finishtimbangneto,
            TRY_CAST(RIGHT(t.noticket, 2) AS INT) AS queue_ticket,
            CASE 
                WHEN tt.starttimbangneto IS NOT NULL AND tt.finishtimbangneto IS NULL THEN 'timbang_netto'
                WHEN tt.startloadingtime IS NOT NULL AND tt.finishloadingtime IS NULL THEN 'loading'
                WHEN tt.starttimbang IS NOT NULL AND tt.finishtimbang IS NULL THEN 'timbang_gross'
                WHEN t.status = 'waiting' THEN 'waiting'
                WHEN t.status = 'finished' THEN 'finished'
                ELSE 'waiting'
            END AS current_phase,
            COALESCE(
                tt.starttimbangneto,
                tt.startloadingtime,
                tt.starttimbang,
                tt.arrivaltime
            ) AS active_time
        FROM trucks t
        JOIN latest_times tt ON t.id = tt.truck_id AND tt.rn = 1
    )

    SELECT 
        truck_id,
        platenumber,
        department,
        current_phase,
        queue_ticket,
        active_time,
        ROW_NUMBER() OVER (
            PARTITION BY department
            ORDER BY
                CASE current_phase
                    WHEN 'waiting' THEN 1
                    WHEN 'timbang_gross' THEN 2
                    WHEN 'loading' THEN 3
                    WHEN 'timbang_netto' THEN 4
                    ELSE 5
                END,
                active_time ASC
        ) AS queue_position
    INTO #ranked
    FROM current_step
    WHERE current_phase <> 'finished';


    -- UPDATE existing
    UPDATE q
    SET 
        q.department = r.department,
        q.queue_position = r.queue_position,
        q.queue_ticket = r.queue_ticket,
        q.last_update = GETDATE()
    FROM truck_queue_actual q
    JOIN #ranked r ON q.truck_id = r.truck_id;

    -- INSERT new
    INSERT INTO truck_queue_actual (truck_id, department, queue_ticket, queue_position, last_update)
    SELECT 
        r.truck_id, 
        r.department, 
        r.queue_ticket,
        r.queue_position, 
        GETDATE()
    FROM #ranked r
    LEFT JOIN truck_queue_actual q ON q.truck_id = r.truck_id
    WHERE q.truck_id IS NULL;

    DROP TABLE #ranked;
END
GO

CREATE OR ALTER TRIGGER trg_update_queue_on_truck_times
ON truck_times
AFTER INSERT, UPDATE
AS
BEGIN
    EXEC sp_update_truck_queue_actual;
END
GO


CREATE OR ALTER TRIGGER trg_update_queue_on_trucks
ON trucks
AFTER INSERT, UPDATE
AS
BEGIN
    EXEC sp_update_truck_queue_actual;
END
GO


-- Table surat jalan
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[suratjalan]') AND type in (N'U'))
BEGIN
    CREATE TABLE suratjalan (
        nosj VARCHAR(50),
        tanggal DATE
    );
END
GO

-- Insert sample data untuk testing rekomendasi 
INSERT INTO suratjalan (nosj, tanggal) VALUES
('SJ/HPC/202409/001', '2025-09-01'),
('SJ/HPC/202409/002', '2025-09-01'),
('SJ/PT/202409/001', '2025-09-01'),
('HPC-SJ-20250901-001', '2025-09-01'),
('SJ-25090-001', '2025-09-01'),
('SJ/HPC/202409/003', '2025-09-02'),
('PT-SJ-20250902-001', '2025-09-02'),
('SJ-HPC-02-001', '2025-09-02'),
('SJ/PT/202409/002', '2025-09-03'),
('SJ-25093-001', '2025-09-03');
GO

-- Insert data trucks
INSERT INTO trucks (
    platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj,
    driver, supplier, eta, status, type, operation, goods,
    descin, descout, statustruck, armada, kelengkapan, jenismobil, date, exittime
) VALUES
('B1234AA', 'TK001', 'PT', 'DRV001', '08123456789', 'SJ001', '2025-10-08', 'Andi', 'PT Maju Jaya', '08:00', 'timbang', 'internal', 'bongkar', 'proses awal', 'Semen', 'Masuk area timbang', 'Menuju bongkar', 'aktif', 'Truk A', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B2345BB', 'TK002', 'HPC', 'DRV002', '08129876543', 'SJ002', '2025-10-08', 'Budi', 'PT Sukses', '09:00', 'unloading', 'external', 'bongkar', 'proses', 'Pasir', 'Mulai bongkar', 'Selesai bongkar', 'aktif', 'Truk B', 'Lengkap', 'Engkel', '2025-10-08', NULL),
('B3456CC', 'TK003', 'PBPG', 'DRV003', '08122334455', 'SJ003', '2025-10-08', 'Cahyo', 'PT Mandiri', '07:45', 'loading', 'internal', 'muat', 'proses', 'Batu Bara', 'Masuk gudang', 'Selesai muat', 'aktif', 'Truk C', 'Lengkap', 'Fuso', '2025-10-08', NULL),
('B4567DD', 'TK004', 'PT', 'DRV004', '08124567890', 'SJ004', '2025-10-08', 'Dedi', 'PT Harapan', '10:15', 'waiting', 'external', 'bongkar', 'menunggu', 'Kapur', 'Antri timbang', 'Belum mulai', 'idle', 'Truk D', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B5678EE', 'TK005', 'HPC', 'DRV005', '08127654321', 'SJ005', '2025-10-08', 'Eko', 'PT Abadi', '11:00', 'timbang', 'internal', 'muat', 'proses awal', 'Gula', 'Menimbang barang', 'Menuju loading', 'aktif', 'Truk E', 'Lengkap', 'Engkel', '2025-10-08', NULL),
('B6789FF', 'TK006', 'PBPG', 'DRV006', '08121234567', 'SJ006', '2025-10-08', 'Fajar', 'PT Bersama', '09:30', 'loading', 'external', 'muat', 'proses', 'Beras', 'Mulai muat', 'Selesai muat', 'aktif', 'Truk F', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B7890GG', 'TK007', 'PT', 'DRV007', '08124566789', 'SJ007', '2025-10-08', 'Gilang', 'PT Jaya', '08:20', 'unloading', 'internal', 'bongkar', 'proses', 'Tepung', 'Masuk loading dock', 'Selesai bongkar', 'aktif', 'Truk G', 'Lengkap', 'Engkel', '2025-10-08', NULL),
('B8901HH', 'TK008', 'HPC', 'DRV008', '08125678901', 'SJ008', '2025-10-08', 'Hendra', 'PT Aman', '07:50', 'waiting', 'external', 'muat', 'menunggu', 'Besi', 'Menunggu giliran', 'Belum muat', 'idle', 'Truk H', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B9012II', 'TK009', 'PBPG', 'DRV009', '08129871234', 'SJ009', '2025-10-08', 'Indra', 'PT Prima', '09:45', 'timbang', 'internal', 'bongkar', 'proses awal', 'Garam', 'Masuk area timbang', 'Menuju unloading', 'aktif', 'Truk I', 'Lengkap', 'Fuso', '2025-10-08', NULL),
('B0123JJ', 'TK010', 'PT', 'DRV010', '08127778899', 'SJ010', '2025-10-08', 'Joko', 'PT Harum', '10:30', 'loading', 'external', 'muat', 'proses', 'Pupuk', 'Mulai muat', 'Selesai muat', 'aktif', 'Truk J', 'Lengkap', 'Engkel', '2025-10-08', NULL),
('B1345KK', 'TK011', 'HPC', 'DRV011', '08125556677', 'SJ011', '2025-10-08', 'Kris', 'PT Sejahtera', '11:20', 'unloading', 'internal', 'bongkar', 'proses', 'Minyak', 'Mulai bongkar', 'Selesai bongkar', 'aktif', 'Truk K', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B2233LL', 'TK012', 'PBPG', 'DRV012', '08129998877', 'SJ012', '2025-10-08', 'Lukman', 'PT Makmur', '09:10', 'waiting', 'external', 'muat', 'menunggu', 'Pakan', 'Menunggu timbang', 'Belum muat', 'idle', 'Truk L', 'Lengkap', 'Fuso', '2025-10-08', NULL),
('B3344MM', 'TK013', 'PT', 'DRV013', '08123334455', 'SJ013', '2025-10-08', 'Maman', 'PT Bangun', '08:10', 'loading', 'internal', 'muat', 'proses', 'Kaca', 'Mulai muat', 'Selesai muat', 'aktif', 'Truk M', 'Lengkap', 'Tronton', '2025-10-08', NULL),
('B4455NN', 'TK014', 'HPC', 'DRV014', '08125557788', 'SJ014', '2025-10-08', 'Niko', 'PT Baru', '10:40', 'timbang', 'external', 'bongkar', 'proses awal', 'Biji Plastik', 'Menimbang', 'Menuju bongkar', 'aktif', 'Truk N', 'Lengkap', 'Engkel', '2025-10-08', NULL),
('B5566OO', 'TK015', 'PBPG', 'DRV015', '08127779900', 'SJ015', '2025-10-08', 'Oscar', 'PT Emas', '11:50', 'unloading', 'internal', 'bongkar', 'selesai', 'Tepung Terigu', 'Mulai bongkar', 'Selesai bongkar', 'selesai', 'Truk O', 'Lengkap', 'Tronton', '2025-10-08', NULL);

INSERT INTO truck_times (
    truck_id, arrivaltime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
    runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
    startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime
)
VALUES
(1,'2025-10-08T07:00:00','00:10:00','07:10:00','07:25:00','00:15:00','00:05:00','00:10:00','07:40:00','00:20:00','07:45:00','08:10:00','00:25:00','00:10:00'),
(2,'2025-10-08T07:30:00','00:08:00','07:38:00','07:50:00','00:12:00','00:06:00','00:09:00','08:05:00','00:15:00','08:10:00','08:35:00','00:25:00','00:08:00'),
(3,'2025-10-08T08:00:00','00:12:00','08:12:00','08:25:00','00:13:00','00:07:00','00:10:00','08:42:00','00:20:00','08:50:00','09:10:00','00:20:00','00:10:00'),
(4,'2025-10-08T08:20:00','00:10:00','08:30:00','08:45:00','00:15:00','00:08:00','00:10:00','09:03:00','00:25:00','09:10:00','09:40:00','00:30:00','00:12:00'),
(5,'2025-10-08T08:45:00','00:09:00','08:54:00','09:10:00','00:16:00','00:05:00','00:08:00','09:25:00','00:20:00','09:30:00','09:55:00','00:25:00','00:10:00'),
(6,'2025-10-08T09:10:00','00:08:00','09:18:00','09:32:00','00:14:00','00:06:00','00:10:00','09:48:00','00:22:00','09:55:00','10:20:00','00:25:00','00:09:00'),
(7,'2025-10-08T09:40:00','00:12:00','09:52:00','10:10:00','00:18:00','00:07:00','00:10:00','10:27:00','00:25:00','10:35:00','11:00:00','00:25:00','00:11:00'),
(8,'2025-10-08T10:00:00','00:10:00','10:10:00','10:25:00','00:15:00','00:05:00','00:08:00','10:38:00','00:18:00','10:45:00','11:15:00','00:30:00','00:09:00'),
(9,'2025-10-08T10:30:00','00:08:00','10:38:00','10:55:00','00:17:00','00:06:00','00:09:00','11:10:00','00:22:00','11:15:00','11:40:00','00:25:00','00:08:00'),
(10,'2025-10-08T10:50:00','00:09:00','10:59:00','11:15:00','00:16:00','00:05:00','00:10:00','11:30:00','00:20:00','11:35:00','12:00:00','00:25:00','00:10:00'),
(11,'2025-10-08T11:10:00','00:12:00','11:22:00','11:38:00','00:16:00','00:06:00','00:09:00','11:53:00','00:21:00','12:00:00','12:25:00','00:25:00','00:09:00'),
(12,'2025-10-08T11:40:00','00:10:00','11:50:00','12:05:00','00:15:00','00:07:00','00:09:00','12:21:00','00:19:00','12:30:00','12:55:00','00:25:00','00:10:00'),
(13,'2025-10-08T12:00:00','00:09:00','12:09:00','12:25:00','00:16:00','00:05:00','00:10:00','12:40:00','00:22:00','12:45:00','13:10:00','00:25:00','00:08:00'),
(14,'2025-10-08T12:30:00','00:11:00','12:41:00','12:55:00','00:14:00','00:06:00','00:09:00','13:10:00','00:23:00','13:15:00','13:40:00','00:25:00','00:09:00'),
(15,'2025-10-08T13:00:00','00:10:00','13:10:00','13:25:00','00:15:00','00:05:00','00:08:00','13:38:00','00:18:00','13:45:00','14:10:00','00:25:00','00:09:00');
INSERT INTO truck_times (
    truck_id, arrivaltime, waitingfortimbang, starttimbang, finishtimbang, totalprocesstimbang,
    runtohpc, waitingforarrivalhpc, entryhpc, totalwaitingarrival,
    startloadingtime, finishloadingtime, totalprocessloadingtime, actualwaitloadingtime
)
VALUES
(1,'2025-10-08T07:00:00','00:10:00','07:10:00','07:25:00','00:15:00','00:05:00','00:10:00','07:40:00','00:20:00','07:45:00','08:10:00','00:25:00','00:10:00'),
(2,'2025-10-08T07:30:00','00:08:00','07:38:00','07:50:00','00:12:00','00:06:00','00:09:00','08:05:00','00:15:00','08:10:00','08:35:00','00:25:00','00:08:00'),
(3,'2025-10-08T08:00:00','00:12:00','08:12:00','08:25:00','00:13:00','00:07:00','00:10:00','08:42:00','00:20:00','08:50:00','09:10:00','00:20:00','00:10:00'),
(4,'2025-10-08T08:20:00','00:10:00','08:30:00','08:45:00','00:15:00','00:08:00','00:10:00','09:03:00','00:25:00','09:10:00','09:40:00','00:30:00','00:12:00'),
(5,'2025-10-08T08:45:00','00:09:00','08:54:00','09:10:00','00:16:00','00:05:00','00:08:00','09:25:00','00:20:00','09:30:00','09:55:00','00:25:00','00:10:00'),
(6,'2025-10-08T09:10:00','00:08:00','09:18:00','09:32:00','00:14:00','00:06:00','00:10:00','09:48:00','00:22:00','09:55:00','10:20:00','00:25:00','00:09:00'),
(7,'2025-10-08T09:40:00','00:12:00','09:52:00','10:10:00','00:18:00','00:07:00','00:10:00','10:27:00','00:25:00','10:35:00','11:00:00','00:25:00','00:11:00'),
(8,'2025-10-08T10:00:00','00:10:00','10:10:00','10:25:00','00:15:00','00:05:00','00:08:00','10:38:00','00:18:00','10:45:00','11:15:00','00:30:00','00:09:00'),
(9,'2025-10-08T10:30:00','00:08:00','10:38:00','10:55:00','00:17:00','00:06:00','00:09:00','11:10:00','00:22:00','11:15:00','11:40:00','00:25:00','00:08:00'),
(10,'2025-10-08T10:50:00','00:09:00','10:59:00','11:15:00','00:16:00','00:05:00','00:10:00','11:30:00','00:20:00','11:35:00','12:00:00','00:25:00','00:10:00'),
(11,'2025-10-08T11:10:00','00:12:00','11:22:00','11:38:00','00:16:00','00:06:00','00:09:00','11:53:00','00:21:00','12:00:00','12:25:00','00:25:00','00:09:00'),
(12,'2025-10-08T11:40:00','00:10:00','11:50:00','12:05:00','00:15:00','00:07:00','00:09:00','12:21:00','00:19:00','12:30:00','12:55:00','00:25:00','00:10:00'),
(13,'2025-10-08T12:00:00','00:09:00','12:09:00','12:25:00','00:16:00','00:05:00','00:10:00','12:40:00','00:22:00','12:45:00','13:10:00','00:25:00','00:08:00'),
(14,'2025-10-08T12:30:00','00:11:00','12:41:00','12:55:00','00:14:00','00:06:00','00:09:00','13:10:00','00:23:00','13:15:00','13:40:00','00:25:00','00:09:00'),
(15,'2025-10-08T13:00:00','00:10:00','13:10:00','13:25:00','00:15:00','00:05:00','00:08:00','13:38:00','00:18:00','13:45:00','14:10:00','00:25:00','00:09:00');
-- Insert userlogin
INSERT INTO userlogin (name, username, password, department, role) VALUES
('Security', 'Security', 'security123', 'Security', 'Security'),
('MARCELLO OCTAVYO ANUGRAHANTO', 'cello', 'cello123', 'IT', 'Staff'),
('Maksudi Indra Rukmana', 'maksudi', 'maksudi123', 'IT', 'Head Department'),
('MIA PUTRI NURDIANTI', 'mia', 'mia123', 'HR', 'HR'),
('DERMAWAN PURBA', 'dermawan', 'dermawan123', 'HR', 'Head Department'),
('Siti Romlah', 'siti', 'siti123', 'HR', 'HR'),
('SAEPUDIN M IKHSAN', 'saepudin', 'saepudin123', 'HR', 'HR'),
('JONATHAN', 'jonathan', 'jonathan123', 'Finance', 'Head Department');
GO

-- Insert sample users for testing
INSERT INTO users (name, uid, licenseplate, department, role) VALUES
('MARCELLO OCTAVYO ANUGRAHANTO', 'EMP001', 'B1234ABC', 'IT', 'Staff'),
('Maksudi Indra Rukmana', 'EMP002', 'B2345DEF', 'IT', 'Head Department'),
('MIA PUTRI NURDIANTI', 'EMP003', 'B3456GHI', 'HR', 'HR'),
('DERMAWAN PURBA', 'EMP004', 'B4567JKL', 'HR', 'Head Department'),
('Siti Romlah', 'EMP005', 'B5678MNO', 'HR', 'HR'),
('SAEPUDIN M IKHSAN', 'EMP006', 'B6789PQR', 'HR', 'HR'),
('JONATHAN', 'EMP007', 'B7890STU', 'Finance', 'Head Department'),
('John Doe Finance Staff', 'EMP008', 'B8901VWX', 'Finance', 'Staff'),
('Jane HR Staff', 'EMP009', 'B9012YZA', 'HR', 'Staff');
GO

-- Insert sample attlog data for testing Hikvision polling
-- Scenario: Employee EMP001 masuk, keluar dengan leave, return, keluar lagi
INSERT INTO attlog (employeeID, authDateTime, authDate, authTime, direction, deviceName, deviceSN, personName, cardNo, processed, status) VALUES
-- Entry pertama
('EMP001', GETDATE(), CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), 'in', 'Main Gate', 'HKV001', 'John Doe', 'B1234ABC', 0, NULL);
GO

-- Insert sample leave permission for testing routing approval system
-- MARCELLO requesting leave, needs approval from Maksudi (HEAD DEPT) and MIA (HR)
INSERT INTO leave_permission (name, uid, licenseplate, department, role, date, exittime, returntime, reason, approval, statusfromdept, statusfromhr, statusfromdirector, submittedat)
VALUES
('MARCELLO OCTAVYO ANUGRAHANTO', 'EMP001', 'B1234ABC', 'IT', 'Staff', CAST(GETDATE() AS DATE), 
 DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 
 'Doctor appointment', 'pending', 'pending', 'pending', 'pending', GETDATE());
GO

-- Insert attendance_logs
INSERT INTO attendance_logs (uid, licenseplate, image_path, datein, dateout, status) VALUES
('UID001', 'B1234ABC', 'UID001-in.jpg', '2025-08-03 08:01:00', NULL, 'in'),
('UID002', 'D5678DEF', 'UID002-in.jpg', '2025-08-03 08:05:00', '2025-08-03 17:02:00', 'out');
GO

PRINT 'Database schema created successfully!';