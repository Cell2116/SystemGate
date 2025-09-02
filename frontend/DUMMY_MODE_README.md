# TruckStore - Dummy Data Mode

## Status Saat Ini
✅ **Menggunakan Dummy Data** - API belum diimplementasi

## Cara Menggunakan

### 1. Mode Dummy (Saat Ini)
```typescript
// Di truckStore.ts
const USE_DUMMY_DATA = true; // ✅ Mode saat ini
```

Fitur yang tersedia dengan dummy data:
- ✅ Fetch surat jalan dengan filter status
- ✅ Loading states dan error simulation
- ✅ Create surat jalan baru
- ✅ Update status surat jalan
- ✅ Retry functionality
- ✅ Auto-refresh

### 2. Migrasi ke API (Nanti)
Ketika API sudah siap, cukup ubah:
```typescript
// Di truckStore.ts
const USE_DUMMY_DATA = false; // 🔄 Ubah ke false
// import axios from "axios"; // 🔄 Uncomment baris ini
```

## Data Dummy Yang Tersedia

| No Surat Jalan | Tanggal | Status | Supplier | Barang |
|---|---|---|---|---|
| SJ001/2025/HPC | 2025-09-01 | pending | PT Alkindo Naratama | Raw Material Paper |
| SJ002/2025/LOG | 2025-09-01 | pending | PT Logistik Prima | Chemical Additives |
| SJ003/2025/PRD | 2025-09-02 | completed | PT Production Supply | Packaging Material |
| SJ004/2025/QUA | 2025-09-02 | pending | PT Quality Materials | Testing Equipment |
| SJ005/2025/HPC | 2025-09-03 | pending | PT Heavy Paper Corp | Heavy Duty Paper |

## Contoh Penggunaan di Component

```typescript
import { useSuratJalan } from '@/store/truckStore';

function MyComponent() {
  // Otomatis fetch data 'pending' saat component mount
  const { data, loading, error, refetch } = useSuratJalan('pending');
  
  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div>
      Error: {error}
      <button onClick={refetch}>Coba Lagi</button>
    </div>
  );
  
  return (
    <div>
      <h3>Daftar Surat Jalan Pending: {data.length}</h3>
      {data.map(sj => (
        <div key={sj.id}>
          <strong>{sj.noSuratJalan}</strong> - {sj.supplier}
          <br />
          <small>{sj.barang} ({sj.jumlahBarang} {sj.unit})</small>
        </div>
      ))}
    </div>
  );
}
```

## Testing Error Handling

Store ini mensimulasi error secara random (5% chance) untuk testing:
- Network errors
- Loading states
- Retry functionality
- Error recovery

## Next Steps

1. **Frontend Integration** ✅ Done
2. **Testing dengan Dummy Data** ← Saat ini di sini
3. **Backend API Development** ← Next step
4. **API Integration** ← Setelah API ready
5. **Production Deployment**

## Checklist untuk API Migration

Ketika API sudah ready:

- [ ] Implement backend endpoints:
  - [ ] `GET /api/surat-jalan`
  - [ ] `GET /api/surat-jalan/:id`  
  - [ ] `POST /api/surat-jalan`
  - [ ] `PATCH /api/surat-jalan/:id/status`

- [ ] Update truckStore.ts:
  - [ ] Set `USE_DUMMY_DATA = false`
  - [ ] Uncomment `import axios from "axios"`
  - [ ] Test API endpoints

- [ ] Database setup:
  - [ ] Create surat_jalan table
  - [ ] Add sample data
  - [ ] Test CRUD operations

## Benefit Mode Dummy

1. **Development Parallel**: Frontend bisa dikembangkan tanpa menunggu backend
2. **UI/UX Testing**: Bisa test user experience dengan data realistis
3. **Error Handling**: Test semua skenario error dan loading states
4. **Easy Switch**: Cukup ubah 1 flag untuk beralih ke API
