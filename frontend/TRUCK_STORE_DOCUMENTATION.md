# TruckStore Documentation

## Overview
TruckStore adalah state management untuk mengelola data truck dan surat jalan menggunakan Zustand. Store ini mengintegrasikan API calls untuk surat jalan dan menyediakan interface yang konsisten dengan pattern yang sudah ada di aplikasi.

## Structure

### Interfaces

#### SuratJalan
```typescript
interface SuratJalan {
  id: string;
  noSuratJalan: string;
  tanggal: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  supplier?: string;
  barang?: string;
  jumlahBarang?: number;
  unit?: string;
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

#### TruckRecord
```typescript
interface TruckRecord {
  id: string;
  plateNumber: string;
  noticket: string;
  department: string;
  nikdriver: string;
  tlpdriver: string;
  nosj: string;
  tglsj: string;
  driver: string;
  supplier: string;
  arrivalTime: string;
  eta?: string;
  status: "pending" | "loading" | "finished";
  type: "internal" | "external";
  goods: string;
  descin: string;
  descout: string;
  statustruck: string;
  estimatedFinish?: string;
  estimatedWaitTime: number;
  actualWaitTime?: number;
  startLoadingTime?: string;
  finishTime?: string;
  date: string;
  quantity?: string;
  unit?: string;
}
```

## Usage

### 1. Basic Store Usage
```typescript
import { useTruckStore } from '@/store/truckStore';

function MyComponent() {
  const store = useTruckStore();
  
  // Access state
  const suratJalanList = store.suratJalanList;
  const loading = store.suratJalanLoading;
  const error = store.suratJalanError;
  
  // Call actions
  const handleFetch = () => {
    store.fetchSuratJalan('pending');
  };
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={handleFetch}>Fetch Data</button>
    </div>
  );
}
```

### 2. Using Custom Hooks

#### useSuratJalan Hook
```typescript
import { useSuratJalan } from '@/store/truckStore';

function SuratJalanComponent() {
  // Auto-fetch surat jalan dengan status 'pending'
  const { data, loading, error, refetch, createSuratJalan, updateStatus } = useSuratJalan('pending');
  
  const handleCreate = async () => {
    try {
      await createSuratJalan({
        noSuratJalan: 'SJ006/2025/NEW',
        tanggal: '2025-09-03',
        supplier: 'PT New Supplier',
        barang: 'New Item'
      });
      console.log('Surat jalan created successfully');
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };
  
  const handleStatusUpdate = async (id: string) => {
    try {
      await updateStatus(id, 'completed');
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  if (loading) return <div>Loading surat jalan...</div>;
  if (error) return <div>Error: {error} <button onClick={refetch}>Retry</button></div>;
  
  return (
    <div>
      <button onClick={handleCreate}>Create New</button>
      {data.map(sj => (
        <div key={sj.id}>
          <span>{sj.noSuratJalan}</span>
          <button onClick={() => handleStatusUpdate(sj.id)}>
            Mark Complete
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### useTrucks Hook
```typescript
import { useTrucks } from '@/store/truckStore';

function TrucksComponent() {
  const { 
    trucks, 
    loading, 
    error, 
    addTruck, 
    updateTruck, 
    removeTruck,
    getTrucksByStatus 
  } = useTrucks();
  
  const pendingTrucks = getTrucksByStatus('pending');
  
  const handleAddTruck = () => {
    const newTruck = {
      id: Date.now().toString(),
      plateNumber: 'B-1234-NEW',
      driver: 'John Doe',
      status: 'pending' as const,
      // ... other required fields
    };
    
    addTruck(newTruck);
  };
  
  return (
    <div>
      <button onClick={handleAddTruck}>Add Truck</button>
      <div>Pending Trucks: {pendingTrucks.length}</div>
      {trucks.map(truck => (
        <div key={truck.id}>
          {truck.plateNumber} - {truck.status}
          <button onClick={() => updateTruck(truck.id, { status: 'loading' })}>
            Start Loading
          </button>
          <button onClick={() => removeTruck(truck.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. In Form Components (like InOutTrucks.tsx)

```typescript
import { useSuratJalan } from '@/store/truckStore';

function InOutTrucksForm() {
  const { 
    data: suratJalanList, 
    loading: suratJalanLoading, 
    error: suratJalanError, 
    refetch: refetchSuratJalan 
  } = useSuratJalan('pending');
  
  return (
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
      disabled={suratJalanLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={
          suratJalanLoading ? "Loading..." :
          suratJalanError ? "Error loading data" :
          "Pilih nomor surat jalan..."
        } />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            Daftar Surat Jalan
            {suratJalanError && (
              <button onClick={refetchSuratJalan}>
                (Retry)
              </button>
            )}
          </SelectLabel>
          {suratJalanLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : suratJalanError ? (
            <SelectItem value="error" disabled>Error: {suratJalanError}</SelectItem>
          ) : (
            suratJalanList.map((sj) => (
              <SelectItem key={sj.id} value={sj.noSuratJalan}>
                <div>
                  <div>{sj.noSuratJalan}</div>
                  <div className="text-xs text-gray-500">{sj.tanggal}</div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

## API Integration

### Endpoints Used
- `GET /api/surat-jalan` - Fetch all surat jalan with optional status filter
- `GET /api/surat-jalan/:id` - Fetch specific surat jalan by ID
- `POST /api/surat-jalan` - Create new surat jalan
- `PATCH /api/surat-jalan/:id/status` - Update surat jalan status

### Error Handling
The store includes comprehensive error handling:
- Network errors
- API response errors
- Loading states
- Retry functionality

### Auto-refresh
The `useSuratJalan` hook automatically fetches data when:
- Component mounts
- Status filter changes
- Store is empty and not loading

## Store Actions

### Surat Jalan Actions
- `fetchSuratJalan(status?)` - Fetch surat jalan list
- `fetchSuratJalanById(id)` - Fetch specific surat jalan
- `createSuratJalan(data)` - Create new surat jalan
- `updateSuratJalanStatus(id, status)` - Update status
- `refreshSuratJalan()` - Refresh current list

### Truck Actions
- `addTruck(truck)` - Add new truck record
- `updateTruck(id, updates)` - Update existing truck
- `removeTruck(id)` - Remove truck record
- `getTruckById(id)` - Get specific truck
- `getTrucksByStatus(status)` - Filter trucks by status
- `getTrucksByType(type)` - Filter trucks by type

### Utility Actions
- `setConnectionStatus(status)` - Update connection status
- `setSuratJalanLoading(loading)` - Set loading state
- `setSuratJalanError(error)` - Set error state
- `clearErrors()` - Clear all errors

## Migration from Old API

### Before (using suratJalanApi.ts)
```typescript
import { fetchSuratJalan } from '@/shared/suratJalanApi';

const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchSuratJalan('pending');
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);
```

### After (using truckStore)
```typescript
import { useSuratJalan } from '@/store/truckStore';

const { data, loading, error } = useSuratJalan('pending');
// Auto-fetches data, handles loading and error states
```

## Best Practices

1. **Use custom hooks** (`useSuratJalan`, `useTrucks`) instead of direct store access when possible
2. **Handle loading states** in UI components
3. **Provide retry mechanisms** for failed API calls
4. **Use appropriate filters** when fetching surat jalan (e.g., 'pending' for active ones)
5. **Update status** when operations complete (e.g., mark surat jalan as 'completed' when truck finishes unloading)
6. **Clear errors** when retrying operations

## Connection with Backend

Ensure your backend implements the required endpoints as defined in `SURAT_JALAN_IMPLEMENTATION.md`. The store is configured to work with the API at `http://192.168.4.62:3000` but this can be changed in the `API_BASE_URL` constant.

## Future Enhancements

1. **Real-time updates** via WebSocket integration
2. **Caching strategy** for better performance
3. **Optimistic updates** for better UX
4. **Pagination** for large datasets
5. **Search and filtering** capabilities
6. **Offline support** with data synchronization
