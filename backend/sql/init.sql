-- !! HIKVISION IVMS TABLE (PostgreSQL version commented)
-- -- Table attlog from Hikvision IVMS (third party database)
-- CREATE TABLE IF NOT EXISTS attlog (
--   id SERIAL PRIMARY KEY,
--   employeeID VARCHAR(50) NOT NULL,
--   authDateTime TIMESTAMP NOT NULL,
--   authDate DATE,
--   authTime TIME,
--   direction VARCHAR(10), -- 'in' or 'out'
--   deviceName VARCHAR(100),
--   deviceSN VARCHAR(100),
--   personName VARCHAR(255),
--   cardNo VARCHAR(50),
--   processed INTEGER DEFAULT 0,
--   status VARCHAR(255)
-- );
-- 
-- -- Index untuk performance polling
-- CREATE INDEX IF NOT EXISTS idx_attlog_processed ON attlog(processed, authDateTime);
-- CREATE INDEX IF NOT EXISTS idx_attlog_employeeid ON attlog(employeeID);
-- CREATE INDEX IF NOT EXISTS idx_attlog_datetime ON attlog(authDateTime);

-- -- Table daftar login
-- CREATE TABLE IF NOT EXISTS userlogin (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   username TEXT NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   department VARCHAR(50) NOT NULL,
--   role VARCHAR(50) NOT NULL
-- );
-- -- Table daftar pengguna RFID
-- CREATE TABLE IF NOT EXISTS users (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   uid VARCHAR(50) UNIQUE NOT NULL,
--   licenseplate VARCHAR(50),
--   department VARCHAR(50) NOT NULL,
--   role VARCHAR(50) NOT NULL
-- );

-- -- Table Leave Permission
-- CREATE TABLE IF NOT EXISTS leave_permission (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   uid VARCHAR(50),
--   licenseplate VARCHAR(50),
--   department VARCHAR(50),
--   role VARCHAR(50),
--   date DATE,
--   exittime TIMESTAMP,
--   returntime TIMESTAMP,
--   actual_exittime TIMESTAMP,
--   actual_returntime TIMESTAMP,
--   reason VARCHAR(255),
--   approval VARCHAR(50),
--   statusfromhr VARCHAR(50),
--   statusfromdept VARCHAR(50),
--   statusfromdirector VARCHAR(50),
--   submittedat TIMESTAMP  
-- );

-- -- Table log absensi
-- CREATE TABLE IF NOT EXISTS attendance_logs (
--   id SERIAL PRIMARY KEY,
--   uid VARCHAR(50),
--   licenseplate VARCHAR(50),
--   image_path TEXT,
--   image_path_out TEXT,
--   image_path_leave_exit VARCHAR(255),
--   image_path_leave_return VARCHAR(255),
--   datein TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   dateout TIMESTAMP,
--   exitTime TIMESTAMP,
--   returnTime TIMESTAMP,
--   actual_exittime TIMESTAMP,
--   actual_returntime TIMESTAMP,
--   status TEXT,
--   leave_permission_id INTEGER REFERENCES leave_permission(id)
-- );
-- create table trucks (
--   id Serial PRIMARY KEY, 
--   platenumber VARCHAR(50), 
--   noticket VARCHAR(50), 
--   department VARCHAR(50), 
--   nikdriver VARCHAR(50), 
--   tlpdriver VARCHAR(50), 
--   nosj VARCHAR(50), 
--   tglsj date,
--   driver VARCHAR(50), 
--   supplier VARCHAR(50), 
--   arrivaltime TIMESTAMP, 
--   eta VARCHAR(50), 
--   status VARCHAR(50), 
--   type VARCHAR(50), 
--   operation VARCHAR(20) CHECK (operation IN ('bongkar', 'muat')),
--   goods VARCHAR(50), 
--   descin VARCHAR(200), 
--   descout VARCHAR(200), 
--   statustruck VARCHAR(50), 
--   totalprocessloadingtime INTERVAL,  
--   actualwaitloadingtime INTERVAL, 
--   startloadingtime TIMESTAMP, 
--   finishloadingtime TIMESTAMP, 
--   date date,
--   armada VARCHAR(50), 
--   kelengkapan VARCHAR(50), 
--   jenismobil VARCHAR(50),
--   driver_photo VARCHAR(255),
--   stnk_photo VARCHAR(255),
--   sim_photo VARCHAR(255)
-- );  

-- COPY users(name, uid, role, department, licenseplate) FROM '/docker-entrypoint-initdb.d/DK4.csv' DELIMITER ';' CSV HEADER;
-- COPY userlogin(name, role, department, username, password) FROM '/docker-entrypoint-initdb.d/userlogin.csv' DELIMITER ';' CSV HEADER;

-- CREATE TABLE suratjalan (
--   nosj VARCHAR(50),
--   tanggal date
-- );

-- -- Insert sample data untuk testing rekomendasi
-- INSERT INTO suratjalan (nosj, tanggal) VALUES
-- ('SJ/HPC/202409/001', '2025-09-01'),
-- ('SJ/HPC/202409/002', '2025-09-01'),
-- ('SJ/PT/202409/001', '2025-09-01'),
-- ('HPC-SJ-20250901-001', '2025-09-01'),
-- ('SJ-25090-001', '2025-09-01'),
-- ('SJ/HPC/202409/003', '2025-09-02'),
-- ('PT-SJ-20250902-001', '2025-09-02'),
-- ('SJ-HPC-02-001', '2025-09-02'),
-- ('SJ/PT/202409/002', '2025-09-03'),
-- ('SJ-25093-001', '2025-09-03');

-- INSERT INTO trucks (
--   platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj, driver, supplier, 
--   arrivaltime, eta, status, type, operation, goods, descin, descout, statustruck, 
--   totalprocessloadingtime, actualwaitloadingtime, startloadingtime, finishloadingtime, date, armada, 
--   kelengkapan, jenismobil, driver_photo, stnk_photo, sim_photo
-- ) VALUES
-- -- 1
-- ('B 1234 CD', 'NT001', 'HPC', '3172011111110001', '081234567890', 'SJ001', '2025-09-10', 'Andi Saputra', 'PT Indo Cargo',
--  '2025-09-10 08:10:00', '2 jam', 'Waiting', 'Inbound', 'bongkar', 'Semen', 'Masuk gerbang 08:05', 'Menuju gudang A', 'Waiting',
--  '02:00:00'::interval, '00:50:00'::interval, '2025-09-10 09:00:00', '2025-09-10 11:00:00', '2025-09-10', 'Armada A',
--  'lengkap', 'Container', 'driver1.jpg', 'stnk1.jpg', 'sim1.jpg'),

-- -- 2
-- ('B 5678 EF', 'NT002', 'PT', '3172011111110002', '081298765432', 'SJ002', '2025-09-11', 'Budi Santoso', 'PT Logistik Jaya',
--  '2025-09-11 07:45:00', '3 jam', 'Loading', 'Outbound', 'muat', 'Besi Baja', 'Masuk gerbang 07:40', 'Proses muat', 'Loading',
--  '03:05:00'::interval, '00:30:00'::interval, '2025-09-11 08:15:00', '2025-09-11 11:20:00', '2025-09-11', 'Armada B',
--  'lengkap', 'Wingbox', 'driver2.jpg', 'stnk2.jpg', 'sim2.jpg'),

-- -- 3
-- ('B 9012 GH', 'NT003', 'HPC', '3172011111110003', '082112345678', 'SJ003', '2025-09-12', 'Cahyo Nugroho', 'PT Sumber Makmur',
--  '2025-09-12 09:20:00', '1.5 jam', 'Finished', 'Inbound', 'bongkar', 'Pupuk', 'Masuk gerbang 09:15', 'Selesai 11:00', 'done',
--  '01:20:00'::interval, '00:15:00'::interval, '2025-09-12 09:35:00', '2025-09-12 10:55:00', '2025-09-12', 'Armada C',
--  'kurang', 'Dumptruck', 'driver3.jpg', 'stnk3.jpg', 'sim3.jpg'),

-- -- 4
-- ('B 3456 IJ', 'NT004', 'PT', '3172011111110004', '082245678901', 'SJ004', '2025-09-13', 'Dedi Kurniawan', 'PT Sentosa',
--  '2025-09-13 10:00:00', '2 jam', 'Waiting', 'Outbound', 'muat', 'Batu Bara', 'Masuk gerbang 09:55', 'Menunggu loading', 'Waiting',
--  '02:20:00'::interval, '00:30:00'::interval, '2025-09-13 10:30:00', '2025-09-13 12:50:00', '2025-09-13', 'Armada D',
--  'lengkap', 'Colt', 'driver4.jpg', 'stnk4.jpg', 'sim4.jpg'),

-- -- 5
-- ('B 7890 KL', 'NT005', 'HPC', '3172011111110005', '083312345678', 'SJ005', '2025-09-14', 'Eko Prasetyo', 'PT Bina Kargo',
--  '2025-09-14 08:40:00', '2.5 jam', 'Waiting', 'Inbound', 'bongkar', 'Gula', 'Masuk gerbang 08:35', 'Menuju gudang B', 'Waiting',
--  '02:10:00'::interval, '00:20:00'::interval, '2025-09-14 09:00:00', '2025-09-14 11:10:00', '2025-09-14', 'Armada E',
--  'lengkap', 'Fuso', 'driver5.jpg', 'stnk5.jpg', 'sim5.jpg'),

-- -- 6
-- ('B 1122 MN', 'NT006', 'PT', '3172011111110006', '083398765432', 'SJ006', '2025-09-15', 'Fajar Ramadhan', 'PT Logistik Prima',
--  '2025-09-15 07:50:00', '3 jam', 'Loading', 'engkel', 'muat', 'Beras', 'Masuk gerbang 07:45', 'Sedang muat', 'Loading',
--  '03:20:00'::interval, '00:30:00'::interval, '2025-09-15 08:20:00', '2025-09-15 11:40:00', '2025-09-15', 'Armada F',
--  'kurang', 'Container', 'driver6.jpg', 'stnk6.jpg', 'sim6.jpg'),

-- -- 7
-- ('B 3344 OP', 'NT007', 'HPC', '3172011111110007', '081311122233', 'SJ007', '2025-09-16', 'Gilang Permana', 'PT Multi Cargo',
--  '2025-09-16 09:15:00', '1.5 jam', 'Finished', 'pickup', 'bongkar', 'Pakan Ternak', 'Masuk gerbang 09:10', 'Proses selesai', 'done',
--  '01:10:00'::interval, '00:20:00'::interval, '2025-09-16 09:35:00', '2025-09-16 10:45:00', '2025-09-16', 'Armada G',
--  'lengkap', 'Wingbox', 'driver7.jpg', 'stnk7.jpg', 'sim7.jpg'),

-- -- 8
-- ('B 5566 QR', 'NT008', 'PT', '3172011111110008', '081399988877', 'SJ008', '2025-09-17', 'Hariyanto', 'PT Cargo Nusantara',
--  '2025-09-17 10:30:00', '2 jam', 'Waiting', 'tronton', 'muat', 'Kayu', 'Masuk gerbang 10:25', 'Menunggu muat', 'Waiting',
--  '02:15:00'::interval, '00:20:00'::interval, '2025-09-17 10:50:00', '2025-09-17 13:05:00', '2025-09-17', 'Armada H',
--  'lengkap', 'Dumptruck', 'driver8.jpg', 'stnk8.jpg', 'sim8.jpg'),

-- -- 9
-- ('B 7788 ST', 'NT009', 'HPC', '3172011111110009', '082211122233', 'SJ009', '2025-09-18', 'Imam Setiawan', 'PT Fast Cargo',
--  '2025-09-18 07:30:00', '2.5 jam', 'Waiting', 'engkel', 'bongkar', 'Pipa Besi', 'Masuk gerbang 07:25', 'Menuju area bongkar', 'Waiting',
--  '02:25:00'::interval, '00:30:00'::interval, '2025-09-18 08:00:00', '2025-09-18 10:25:00', '2025-09-18', 'Armada I',
--  'kurang', 'Colt', 'driver9.jpg', 'stnk9.jpg', 'sim9.jpg'),

-- -- 10
-- ('B 9900 UV', 'NT010', 'PT', '3172011111110010', '082266677788', 'SJ010', '2025-09-19', 'Joko Widodo', 'PT Prima Transport',
--  '2025-09-19 08:00:00', '3 jam', 'Loading', 'fuso', 'muat', 'Minyak Goreng', 'Masuk gerbang 07:55', 'Proses loading', 'Loading',
--  '03:00:00'::interval, '00:25:00'::interval, '2025-09-19 08:25:00', '2025-09-19 11:25:00', '2025-09-19', 'Armada J',
--  'lengkap', 'Fuso', 'driver10.jpg', 'stnk10.jpg', 'sim10.jpg'),

-- -- 11
-- ('B 2233 WX', 'NT011', 'HPC', '3172011111110011', '081322233344', 'SJ011', '2025-09-20', 'Kurniawan', 'PT Sumber Daya',
--  '2025-09-20 09:10:00', '1.5 jam', 'Finished', 'engkel', 'bongkar', 'Keramik', 'Masuk gerbang 09:05', 'Selesai 10:40', 'done',
--  '01:25:00'::interval, '00:25:00'::interval, '2025-09-20 09:35:00', '2025-09-20 11:00:00', '2025-09-20', 'Armada K',
--  'lengkap', 'History Operation', 'driver11.jpg', 'stnk11.jpg', 'sim11.jpg'),

-- -- 12
-- ('B 4455 YZ', 'NT012', 'PT', '3172011111110012', '081366677799', 'SJ012', '2025-09-21', 'Lukman Hakim', 'PT Cargo Cepat',
--  '2025-09-21 07:50:00', '2 jam', 'Waiting', 'pickup', 'muat', 'Aluminium', 'Masuk gerbang 07:45', 'Menunggu loading', 'Waiting',
--  '02:15:00'::interval, '00:25:00'::interval, '2025-09-21 08:15:00', '2025-09-21 10:30:00', '2025-09-21', 'Armada L',
--  'kurang', 'Container', 'driver12.jpg', 'stnk12.jpg', 'sim12.jpg'),

-- -- 13
-- ('B 6677 ZA', 'NT013', 'HPC', '3172011111110013', '082277788899', 'SJ013', '2025-09-22', 'Mulyadi', 'PT Makmur Bersama',
--  '2025-09-22 08:30:00', '2.5 jam', 'Waiting', 'tronton', 'bongkar', 'Gandum', 'Masuk gerbang 08:25', 'Menuju gudang C', 'Waiting',
--  '02:25:00'::interval, '00:30:00'::interval, '2025-09-22 09:00:00', '2025-09-22 11:25:00', '2025-09-22', 'Armada M',
--  'lengkap', 'Wingbox', 'driver13.jpg', 'stnk13.jpg', 'sim13.jpg'),

-- -- 14
-- ('B 8899 BC', 'NT014', 'PT', '3172011111110014', '083311122233', 'SJ014', '2025-09-23', 'Nugraha', 'PT Transportasi Jaya',
--  '2025-09-23 07:40:00', '3 jam', 'Loading', 'engkel', 'muat', 'Kertas', 'Masuk gerbang 07:35', 'Proses muat', 'Loading',
--  '02:55:00'::interval, '00:30:00'::interval, '2025-09-23 08:10:00', '2025-09-23 11:05:00', '2025-09-23', 'Armada N',
--  'kurang', 'Dumptruck', 'driver14.jpg', 'stnk14.jpg', 'sim14.jpg'),

-- -- 15
-- ('B 4455 DE', 'NT015', 'HPC', '3172011111110015', '083344455566', 'SJ015', '2025-09-24', 'Oscar Pranata', 'PT Berkah Abadi',
--  '2025-09-24 09:00:00', '1.5 jam', 'Finished', 'pickup', 'bongkar', 'Tepung', 'Masuk gerbang 08:55', 'Selesai 10:30', 'done',
--  '01:15:00'::interval, '00:10:00'::interval, '2025-09-24 09:10:00', '2025-09-24 10:25:00', '2025-09-24', 'Armada O',
--  'lengkap', 'Colt', 'driver15.jpg', 'stnk15.jpg', 'sim15.jpg');

-- -- -- Dummy users
-- -- INSERT INTO users (name, uid, licenseplate, department, role) VALUES
-- -- ('Andi Wijaya',     'UID001', 'B 1234 ABC', 'Engineering', 'Staff'),
-- -- ('Budi Santoso',    'UID002', 'D 5678 DEF', 'HR',         'Staff'),
-- -- ('Clara Sari',      'UID003', 'F 9876 XYZ', 'Finance',     'Head Department'),
-- -- ('Dewi Ayu',        'UID004', 'G 1122 HJK', 'HR', 'Staff'),
-- -- ('Eko Prasetyo',    'UID005', 'H 4455 LMN', 'General',     'Director'),
-- -- ('Marcello',        'CD131D06', 'D 1235 AD', 'IT',     'Staff'),
-- -- ('Test 2',          '9B023306', 'D 1234 AD', 'IT',     'Head Department');

-- INSERT INTO userlogin (name, username, password, department, role) VALUES
-- ('Security',     'Security', 'security123', 'Security', 'Security'),
-- ('MARCELLO OCTAVYO ANUGRAHANTO',     'cello', 'cello123', 'IT', 'Staff');


-- -- ATTENDANCE_LOGS
-- INSERT INTO attendance_logs (uid, licenseplate, image_path, datein, dateout, status) VALUES
-- ('UID001', 'B1234ABC', 'UID001-in.jpg', '2025-08-03 08:01:00', NULL, 'in'),
-- ('UID002', 'D5678DEF', 'UID002-in.jpg', '2025-08-03 08:05:00', '2025-08-03 17:02:00', 'out');
-- -- ('UID003', 'F9876XYZ', 'UID003-in.jpg', '2025-08-03 07:55:00', NULL, 'in');

-- -- LEAVE_PERMISSION
-- -- INSERT INTO leave_permission (
-- --   name, uid, licenseplate, department, role, date, exittime, returntime, reason,
-- --   approval, statusfromhr, statusfromdept, statusfromdirector
-- -- ) VALUES
-- -- (
-- --   'Andi Wijaya', 'UID001', 'B1234ABC', 'Engineering', 'Staff',
-- --   '2025-08-03', '2025-08-03 10:00:00', '2025-08-03 12:00:00',
-- --   'Ke dokter gigi', 'approved', 'approved', 'approved', 'pending'
-- -- ),
-- -- (
-- --   'Budi Santoso', 'UID002', 'D5678DEF', 'HR', 'Staff',
-- --   '2025-08-02', '2025-08-02 14:30:00', '2025-08-02 16:00:00',
-- --   'Ada urusan keluarga', 'pending', 'pending', 'approved', 'pending'
-- -- ),
-- -- (
-- --   'Clara Sari', 'UID003', 'F9876XYZ', 'Finance', 'Head Department',
-- --   '2025-08-01', '2025-08-01 09:00:00', '2025-08-01 11:00:00',
-- --   'Meeting eksternal', 'rejected', 'approved', 'rejected', 'rejected'
-- -- )
-- -- ON CONFLICT DO NOTHING;


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

-- Table daftar login
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

-- Table daftar pengguna RFID
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(MAX) NOT NULL,
        uid VARCHAR(50) UNIQUE NOT NULL,
        licenseplate VARCHAR(50),
        department VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL
    );
END
GO

-- Table Leave Permission
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
        submittedat DATETIME2
    );
END
GO

-- Table log absensi
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

-- Table trucks
-- IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[trucks]') AND type in (N'U'))
-- BEGIN
--     CREATE TABLE trucks (
--         id INT IDENTITY(1,1) PRIMARY KEY,
--         platenumber VARCHAR(50),
--         noticket VARCHAR(50),
--         department VARCHAR(50),
--         nikdriver VARCHAR(50),
--         tlpdriver VARCHAR(50),
--         nosj VARCHAR(50),
--         tglsj DATE,
--         driver VARCHAR(50),
--         supplier VARCHAR(50),
--         eta VARCHAR(50),
--         status VARCHAR(50),
--         type VARCHAR(50),
--         operation VARCHAR(20) CHECK (operation IN ('bongkar', 'muat')),
--         statusprocess VARCHAR(50),
--         goods VARCHAR(50),
--         descin VARCHAR(200),
--         descout VARCHAR(200),
--         statustruck VARCHAR(50),
--         armada VARCHAR(50),
--         kelengkapan VARCHAR(50),
--         jenismobil VARCHAR(50),
--         driver_photo VARCHAR(255),
--         stnk_photo VARCHAR(255),
--         sim_photo VARCHAR(255),
--         date DATE,
--         arrivaltime DATETIME2,
--         waitingfortimbang TIME,
--         starttimbang TIME,
--         finishtimbang TIME,
--         totalprocesstimbang TIME,
--         runtohpc TIME,
--         waitingforarrivalhpc TIME,
--         entryhpc TIME,
--         totalwaitingarrival TIME,
--         startloadingtime TIME,
--         finishloadingtime TIME,
--         totalprocessloadingtime TIME,
--         actualwaitloadingtime TIME,
--         exittime DATETIME2
--     );
-- END
-- GO

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
        date DATE,
        exittime DATETIME2
    );
END
GO

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
        totalwaitingarrival TIME,
        startloadingtime TIME,
        finishloadingtime TIME,
        totalprocessloadingtime TIME,
        actualwaitloadingtime TIME
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
('MARCELLO OCTAVYO ANUGRAHANTO', 'cello', 'cello123', 'IT', 'Staff');
GO

-- Insert sample users for testing
INSERT INTO users (name, uid, licenseplate, department, role) VALUES
('John Doe', 'EMP001', 'B1234ABC', 'IT', 'Staff'),
('Jane Smith', 'EMP002', 'B5678DEF', 'HR', 'Staff'),
('Bob Manager', 'EMP003', 'B9012GHI', 'Finance', 'Head Department');
GO

-- Insert sample attlog data for testing Hikvision polling
-- Scenario: Employee EMP001 masuk, keluar dengan leave, return, keluar lagi
INSERT INTO attlog (employeeID, authDateTime, authDate, authTime, direction, deviceName, deviceSN, personName, cardNo, processed, status) VALUES
-- Entry pertama
('EMP001', GETDATE(), CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), 'in', 'Main Gate', 'HKV001', 'John Doe', 'B1234ABC', 0, NULL);
GO

-- Insert attendance_logs
INSERT INTO attendance_logs (uid, licenseplate, image_path, datein, dateout, status) VALUES
('UID001', 'B1234ABC', 'UID001-in.jpg', '2025-08-03 08:01:00', NULL, 'in'),
('UID002', 'D5678DEF', 'UID002-in.jpg', '2025-08-03 08:05:00', '2025-08-03 17:02:00', 'out');
GO

PRINT 'Database schema created successfully!';