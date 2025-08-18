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
  licenseplate VARCHAR(50) UNIQUE NOT NULL,
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

-- Dummy users
INSERT INTO users (name, uid, licenseplate, department, role) VALUES
('Andi Wijaya',     'UID001', 'B1234ABC', 'Engineering', 'Staff'),
('Budi Santoso',    'UID002', 'D5678DEF', 'HR',         'Staff'),
('Clara Sari',      'UID003', 'F9876XYZ', 'Finance',     'Head Department'),
('Dewi Ayu',        'UID004', 'G1122HJK', 'HR', 'Staff'),
('Eko Prasetyo',    'UID005', 'H4455LMN', 'General',     'Director'),
('Marcello',        'CD131D06', 'D1235AD', 'IT',     'Staff'),
('Test 2',          '9B023306', 'D1234AD', 'IT',     'Head Department');

INSERT INTO userlogin (name, username, password, department, role) VALUES
('Marcello',     'marcello', 'cello123456', 'IT', 'Staff'),
('Head Department Test',     'headdept', 'hd123456', 'IT', 'Head Department'),
('Director Test',     'dr', 'dr123456', 'Director', 'Director'),
('HR Test',     'hr', 'hr123456', 'HR', 'HR'),
('Super User',     'superuser', 'su123456', 'IT', 'Super User');


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
