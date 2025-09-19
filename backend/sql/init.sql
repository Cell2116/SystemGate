-- Table daftar login
CREATE TABLE IF NOT EXISTS userlogin (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL
);
-- Table daftar pengguna RFID
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  uid VARCHAR(50) UNIQUE NOT NULL,
  licenseplate VARCHAR(50),
  department VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL
);

-- Table Leave Permission
CREATE TABLE IF NOT EXISTS leave_permission (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  uid VARCHAR(50),
  licenseplate VARCHAR(50),
  department VARCHAR(50),
  role VARCHAR(50),
  date DATE,
  exittime TIMESTAMP,
  returntime TIMESTAMP,
  actual_exittime TIMESTAMP,
  actual_returntime TIMESTAMP,
  reason VARCHAR(255),
  approval VARCHAR(50),
  statusfromhr VARCHAR(50),
  statusfromdept VARCHAR(50),
  statusfromdirector VARCHAR(50),
  submittedat TIMESTAMP  
);

-- Table log absensi
CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(50),
  licenseplate VARCHAR(50),
  image_path TEXT,
  image_path_out TEXT,
  image_path_leave_exit VARCHAR(255),
  image_path_leave_return VARCHAR(255),
  datein TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dateout TIMESTAMP,
  exitTime TIMESTAMP,
  returnTime TIMESTAMP,
  actual_exittime TIMESTAMP,
  actual_returntime TIMESTAMP,
  status TEXT,
  leave_permission_id INTEGER REFERENCES leave_permission(id)
);
create table trucks (
  id Serial PRIMARY KEY, 
  platenumber VARCHAR(50), 
  noticket VARCHAR(50), 
  department VARCHAR(50), 
  nikdriver VARCHAR(50), 
  tlpdriver VARCHAR(50), 
  nosj VARCHAR(50), 
  tglsj date,
  driver VARCHAR(50), 
  supplier VARCHAR(50), 
  arrivaltime TIMESTAMP, 
  eta VARCHAR(50), 
  status VARCHAR(50), 
  type VARCHAR(50), 
  operation VARCHAR(20) CHECK (operation IN ('bongkar', 'muat')),
  goods VARCHAR(50), 
  descin VARCHAR(200), 
  descout VARCHAR(200), 
  statustruck VARCHAR(50), 
  estimatedfinish TIMESTAMP, 
  estimatedwaittime TIMESTAMP, 
  actualwaittime TIMESTAMP, 
  startloadingtime TIMESTAMP, 
  finishtime TIMESTAMP, 
  date date,
  armada VARCHAR(50), 
  kelengkapan VARCHAR(50), 
  jenismobil VARCHAR(50)
);  

COPY users(name, uid, role, department, licenseplate) FROM '/docker-entrypoint-initdb.d/DK4.csv' DELIMITER ';' CSV HEADER;
COPY userlogin(name, role, department, username, password) FROM '/docker-entrypoint-initdb.d/userlogin.csv' DELIMITER ';' CSV HEADER;

CREATE TABLE suratjalan (
  nosj VARCHAR(50),
  tanggal date
);

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

INSERT INTO trucks (
  platenumber, noticket, department, nikdriver, tlpdriver, nosj, tglsj, driver, supplier,
  arrivaltime, eta, status, type, operation, goods, descin, descout, statustruck, estimatedfinish,
  estimatedwaittime, actualwaittime, startloadingtime, finishtime, date, armada, kelengkapan, jenismobil
) VALUES
('B1234CD', 'TCK001', 'Logistics', 'DR001', '081234567890', 'SJ001', '2025-09-01', 'Andi', 'PT Sumber Makmur',
 '2025-09-01 08:00:00', '09:00', 'Waiting', 'Inbound', 'bongkar', 'Cement', 'Truck arrived at gate', 'Waiting for loading', 'Queue',
 '2025-09-01 12:00:00', '2025-09-01 10:00:00', '2025-09-01 10:15:00', '2025-09-01 10:20:00', '2025-09-01 11:50:00', '2025-09-01', 'Hino', 'Complete', 'Tronton'),

('B5678EF', 'TCK002', 'Production', 'DR002', '081298765432', 'SJ002', '2025-09-02', 'Budi', 'PT Sentosa',
 '2025-09-02 07:45:00', '08:30', 'Loading', 'Outbound', 'muat', 'Steel', 'Arrived warehouse', 'Loading in progress', 'Loading',
 '2025-09-02 11:30:00', '2025-09-02 08:30:00', '2025-09-02 09:00:00', '2025-09-02 09:10:00', '2025-09-02 11:00:00', '2025-09-02', 'Isuzu', 'Incomplete', 'Wingbox'),

('B9101GH', 'TCK003', 'Warehouse', 'DR003', '081255544433', 'SJ003', '2025-09-03', 'Cahyo', 'PT Berkah',
 '2025-09-03 09:10:00', '10:00', 'Waiting', 'Inbound', 'bongkar', 'Sand', 'Arrived at warehouse', 'Waiting schedule', 'Queue',
 '2025-09-03 13:00:00', '2025-09-03 11:00:00', '2025-09-03 11:20:00', '2025-09-03 11:30:00', '2025-09-03 12:45:00', '2025-09-03', 'Mitsubishi', 'Complete', 'Tronton'),

('B2233IJ', 'TCK004', 'Logistics', 'DR004', '081288899900', 'SJ004', '2025-09-04', 'Dedi', 'PT Jaya Abadi',
 '2025-09-04 08:30:00', '09:15', 'Finished', 'Outbound', 'muat', 'Coal', 'Checked in', 'Left site', 'Completed',
 '2025-09-04 12:30:00', '2025-09-04 09:30:00', '2025-09-04 09:40:00', '2025-09-04 09:50:00', '2025-09-04 11:40:00', '2025-09-04', 'Hino', 'Complete', 'Dumptruck'),

('B3344KL', 'TCK005', 'Production', 'DR005', '081277766655', 'SJ005', '2025-09-05', 'Eko', 'PT Bintang',
 '2025-09-05 07:50:00', '08:20', 'Waiting', 'Inbound', 'bongkar', 'Limestone', 'At main gate', 'Queued for unloading', 'Queue',
 '2025-09-05 11:50:00', '2025-09-05 09:00:00', '2025-09-05 09:10:00', '2025-09-05 09:15:00', '2025-09-05 11:20:00', '2025-09-10', 'Fuso', 'Complete', 'Wingbox');
-- -- Dummy users
-- INSERT INTO users (name, uid, licenseplate, department, role) VALUES
-- ('Andi Wijaya',     'UID001', 'B 1234 ABC', 'Engineering', 'Staff'),
-- ('Budi Santoso',    'UID002', 'D 5678 DEF', 'HR',         'Staff'),
-- ('Clara Sari',      'UID003', 'F 9876 XYZ', 'Finance',     'Head Department'),
-- ('Dewi Ayu',        'UID004', 'G 1122 HJK', 'HR', 'Staff'),
-- ('Eko Prasetyo',    'UID005', 'H 4455 LMN', 'General',     'Director'),
-- ('Marcello',        'CD131D06', 'D 1235 AD', 'IT',     'Staff'),
-- ('Test 2',          '9B023306', 'D 1234 AD', 'IT',     'Head Department');

-- INSERT INTO userlogin (name, username, password, department, role) VALUES
-- ('Security',     'Security', 'security123', 'Security', 'Security'),


-- ATTENDANCE_LOGS
INSERT INTO attendance_logs (uid, licenseplate, image_path, datein, dateout, status) VALUES
('UID001', 'B1234ABC', 'UID001-in.jpg', '2025-08-03 08:01:00', NULL, 'in'),
('UID002', 'D5678DEF', 'UID002-in.jpg', '2025-08-03 08:05:00', '2025-08-03 17:02:00', 'out');
-- ('UID003', 'F9876XYZ', 'UID003-in.jpg', '2025-08-03 07:55:00', NULL, 'in');

-- LEAVE_PERMISSION
INSERT INTO leave_permission (
  name, uid, licenseplate, department, role, date, exittime, returntime, reason,
  approval, statusfromhr, statusfromdept, statusfromdirector
) VALUES
(
  'Andi Wijaya', 'UID001', 'B1234ABC', 'Engineering', 'Staff',
  '2025-08-03', '2025-08-03 10:00:00', '2025-08-03 12:00:00',
  'Ke dokter gigi', 'approved', 'approved', 'approved', 'pending'
),
(
  'Budi Santoso', 'UID002', 'D5678DEF', 'HR', 'Staff',
  '2025-08-02', '2025-08-02 14:30:00', '2025-08-02 16:00:00',
  'Ada urusan keluarga', 'pending', 'pending', 'approved', 'pending'
),
(
  'Clara Sari', 'UID003', 'F9876XYZ', 'Finance', 'Head Department',
  '2025-08-01', '2025-08-01 09:00:00', '2025-08-01 11:00:00',
  'Meeting eksternal', 'rejected', 'approved', 'rejected', 'rejected'
)
ON CONFLICT DO NOTHING;
