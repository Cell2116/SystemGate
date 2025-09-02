# Implementasi Database untuk Surat Jalan

## Overview
Dokumen ini menjelaskan cara mengimplementasikan database untuk fitur surat jalan pada sistem SystemGate.

## Struktur Database

### Tabel surat_jalan
```sql
CREATE TABLE surat_jalan (
    id VARCHAR(50) PRIMARY KEY,
    no_surat_jalan VARCHAR(100) NOT NULL UNIQUE,
    tanggal DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    supplier VARCHAR(100),
    barang VARCHAR(200),
    jumlah_barang DECIMAL(10,2),
    unit VARCHAR(20),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Index untuk optimisasi query
CREATE INDEX idx_surat_jalan_tanggal ON surat_jalan(tanggal);
CREATE INDEX idx_surat_jalan_status ON surat_jalan(status);
CREATE INDEX idx_surat_jalan_no ON surat_jalan(no_surat_jalan);
```

### Tabel truck_surat_jalan (Relasi dengan truck)
```sql
CREATE TABLE truck_surat_jalan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    truck_id VARCHAR(50),
    surat_jalan_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (surat_jalan_id) REFERENCES surat_jalan(id) ON DELETE CASCADE,
    UNIQUE KEY unique_truck_surat_jalan (truck_id, surat_jalan_id)
);
```

## Implementasi Backend

### 1. Update db.js
Tambahkan fungsi-fungsi berikut di `backend/db.js`:

```javascript
// Fungsi untuk mengambil semua surat jalan
export async function getAllSuratJalan(status = null) {
    let query = `
        SELECT id, no_surat_jalan, tanggal, status, supplier, barang, 
               jumlah_barang, unit, keterangan, created_at, updated_at
        FROM surat_jalan
    `;
    let params = [];
    
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY tanggal DESC, created_at DESC';
    
    return await executeQuery(query, params);
}

// Fungsi untuk mengambil surat jalan berdasarkan ID
export async function getSuratJalanById(id) {
    const query = `
        SELECT id, no_surat_jalan, tanggal, status, supplier, barang, 
               jumlah_barang, unit, keterangan, created_at, updated_at
        FROM surat_jalan 
        WHERE id = ?
    `;
    
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
}

// Fungsi untuk membuat surat jalan baru
export async function createSuratJalan(data) {
    const query = `
        INSERT INTO surat_jalan 
        (id, no_surat_jalan, tanggal, status, supplier, barang, jumlah_barang, unit, keterangan, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        data.id,
        data.no_surat_jalan,
        data.tanggal,
        data.status || 'pending',
        data.supplier,
        data.barang,
        data.jumlah_barang,
        data.unit,
        data.keterangan,
        data.created_by
    ];
    
    return await executeQuery(query, params);
}

// Fungsi untuk update status surat jalan
export async function updateSuratJalanStatus(id, status, updated_by) {
    const query = `
        UPDATE surat_jalan 
        SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    return await executeQuery(query, [status, updated_by, id]);
}

// Fungsi untuk menghubungkan truck dengan surat jalan
export async function linkTruckToSuratJalan(truckId, suratJalanId) {
    const query = `
        INSERT INTO truck_surat_jalan (truck_id, surat_jalan_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
    
    return await executeQuery(query, [truckId, suratJalanId]);
}
```

### 2. Update server.js
Ganti implementasi dummy di `backend/server.js` dengan yang menggunakan database:

```javascript
// Import fungsi dari db.js
import * as db from './db.js';

// API endpoint untuk mendapatkan daftar surat jalan
app.get('/api/surat-jalan', async (req, res) => {
    try {
        const { status } = req.query;
        const results = await db.getAllSuratJalan(status);
        
        res.json({
            success: true,
            data: results,
            message: 'Data surat jalan berhasil diambil'
        });
    } catch (error) {
        console.error('Error fetching surat jalan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data surat jalan',
            error: error.message
        });
    }
});

// API endpoint untuk mendapatkan detail surat jalan berdasarkan ID
app.get('/api/surat-jalan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.getSuratJalanById(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Surat jalan tidak ditemukan'
            });
        }
        
        res.json({
            success: true,
            data: result,
            message: 'Detail surat jalan berhasil diambil'
        });
    } catch (error) {
        console.error('Error fetching surat jalan detail:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail surat jalan',
            error: error.message
        });
    }
});

// API endpoint untuk membuat surat jalan baru
app.post('/api/surat-jalan', async (req, res) => {
    try {
        const data = {
            id: generateId(), // Implementasikan fungsi generateId()
            ...req.body,
            created_by: req.user?.id || 'system' // Dari JWT token
        };
        
        await db.createSuratJalan(data);
        
        res.status(201).json({
            success: true,
            message: 'Surat jalan berhasil dibuat',
            data: data
        });
    } catch (error) {
        console.error('Error creating surat jalan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat surat jalan',
            error: error.message
        });
    }
});

// API endpoint untuk update status surat jalan
app.patch('/api/surat-jalan/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated_by = req.user?.id || 'system';
        
        await db.updateSuratJalanStatus(id, status, updated_by);
        
        res.json({
            success: true,
            message: 'Status surat jalan berhasil diupdate'
        });
    } catch (error) {
        console.error('Error updating surat jalan status:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate status surat jalan',
            error: error.message
        });
    }
});
```

## Implementasi Frontend

### 1. Update InOutTrucks.tsx
Ganti data dummy dengan API call:

```typescript
import { useSuratJalan } from '@/shared/suratJalanApi';

export default function InOutTrucks() {
  // Ganti data dummy dengan hook
  const { data: suratJalanList, loading, error } = useSuratJalan('pending');
  
  // ... kode lainnya
  
  // Di dalam form step 3:
  {inputMode === "select" ? (
    <div className="space-y-4">
      <div>
        <Label htmlFor="suratJalanSelect" className="text-sm font-semibold">
          Pilih Surat Jalan /
          <span className="italic opacity-50 text-xs"> Select Delivery Note</span>
        </Label>
        {loading ? (
          <div className="h-9 border border-gray-300 rounded-md px-3 py-2 flex items-center">
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : error ? (
          <div className="h-9 border border-red-300 rounded-md px-3 py-2 flex items-center text-red-500">
            Error: {error}
          </div>
        ) : (
          <Select
            value={formData.nosj}
            onValueChange={(value) => {
              const selectedSJ = suratJalanList.find(sj => sj.noSuratJalan === value);
              if (selectedSJ) {
                setFormData({
                  ...formData, 
                  nosj: selectedSJ.noSuratJalan,
                  tglsj: selectedSJ.tanggal
                });
              }
            }}
          >
            <SelectTrigger className="h-9 border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Pilih nomor surat jalan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Daftar Surat Jalan</SelectLabel>
                {suratJalanList.map((sj) => (
                  <SelectItem key={sj.id} value={sj.noSuratJalan}>
                    <div className="flex flex-col">
                      <span className="font-medium">{sj.noSuratJalan}</span>
                      <span className="text-xs text-gray-500">{sj.tanggal}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      // ... sisa kode
    </div>
  ) : (
    // ... mode manual input
  )}
}
```

## Migration Steps

### Tahap 1: Setup Database
1. Jalankan script SQL untuk membuat tabel
2. Insert data sample untuk testing
3. Test koneksi database

### Tahap 2: Backend Implementation
1. Update `db.js` dengan fungsi-fungsi surat jalan
2. Update `server.js` dengan API endpoints
3. Test API endpoints dengan Postman

### Tahap 3: Frontend Integration
1. Test API dengan suratJalanApi.ts
2. Update InOutTrucks.tsx untuk menggunakan API
3. Handle loading states dan error handling

### Tahap 4: Testing & Optimization
1. Test end-to-end flow
2. Optimize database queries
3. Add proper error handling dan logging

## Sample Data
```sql
INSERT INTO surat_jalan 
(id, no_surat_jalan, tanggal, status, supplier, barang, jumlah_barang, unit, created_by) 
VALUES 
('SJ001', 'SJ001/2025/HPC', '2025-09-01', 'pending', 'PT ABC Supply', 'Material Bangunan', 100.00, 'kg', 'admin'),
('SJ002', 'SJ002/2025/LOG', '2025-09-01', 'pending', 'PT DEF Logistics', 'Komponen Elektronik', 50.00, 'pcs', 'admin'),
('SJ003', 'SJ003/2025/PRD', '2025-09-02', 'completed', 'PT GHI Production', 'Bahan Kimia', 200.00, 'liter', 'admin'),
('SJ004', 'SJ004/2025/QUA', '2025-09-02', 'pending', 'PT JKL Quality', 'Spare Parts', 25.00, 'set', 'admin'),
('SJ005', 'SJ005/2025/HPC', '2025-09-03', 'pending', 'PT MNO Heavy', 'Mesin Industri', 1.00, 'unit', 'admin');
```

## Environment Variables
Tambahkan di `.env` file:
```
# Database Configuration for Surat Jalan
ENABLE_SURAT_JALAN_API=true
SURAT_JALAN_CACHE_TTL=300
```

## Monitoring & Logging
- Log semua API calls untuk surat jalan
- Monitor performance query database
- Set up alerts untuk error rate tinggi
- Track usage statistics untuk optimisasi
