import React from 'react';
import { useSuratJalan, useTruckStore } from '../store/truckStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Truck, Package, Calendar, Building2, RefreshCw, Plus } from 'lucide-react';

/**
 * Demo component untuk menunjukkan penggunaan TruckStore
 * Komponen ini bisa digunakan untuk testing dan development
 */
export default function TruckStoreDemo() {
  // Menggunakan custom hook untuk surat jalan
  const { data: pendingSJ, loading, error, refetch } = useSuratJalan('pending');
  const { data: allSJ } = useSuratJalan(); // Semua surat jalan
  
  // Menggunakan store langsung untuk actions
  const { createSuratJalan, updateSuratJalanStatus } = useTruckStore();

  // Handler untuk membuat surat jalan baru
  const handleCreateNew = async () => {
    try {
      const newData = {
        noSuratJalan: `SJ${Date.now()}/2025/DEMO`,
        tanggal: new Date().toISOString().split('T')[0],
        supplier: 'PT Demo Supplier',
        barang: 'Demo Product',
        jumlahBarang: 10,
        unit: 'Pcs',
        keterangan: 'Testing create dari frontend'
      };
      
      await createSuratJalan(newData);
      alert('Surat jalan baru berhasil dibuat!');
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  // Handler untuk mengubah status
  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await updateSuratJalanStatus(id, newStatus);
      alert(`Status berhasil diubah ke ${newStatus}`);
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6" />
          TruckStore Demo
        </h1>
        <Badge variant="outline" className="text-sm">
          Mode: Dummy Data
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Surat Jalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSJ.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSJ.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allSJ.filter(sj => sj.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
        <Button onClick={handleCreateNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Buat Surat Jalan Baru
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading data surat jalan...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-center">
              <p className="font-medium">Error: {error}</p>
              <Button onClick={refetch} variant="outline" size="sm" className="mt-2">
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data List */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Surat Jalan Pending</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSJ.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Tidak ada surat jalan pending
              </p>
            ) : (
              <div className="space-y-3">
                {pendingSJ.map((sj) => (
                  <div key={sj.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{sj.noSuratJalan}</div>
                      <div className="text-sm text-gray-600">{sj.supplier}</div>
                      <div className="text-sm text-gray-500">
                        {sj.barang} - {sj.jumlahBarang} {sj.unit}
                      </div>
                      <div className="text-xs text-gray-400">{sj.tanggal}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(sj.status)}>
                        {sj.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(sj.id, 'in_progress')}
                        >
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(sj.id, 'completed')}
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Semua Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {['pending', 'in_progress', 'completed', 'cancelled'].map(status => {
              const count = allSJ.filter(sj => sj.status === status).length;
              return (
                <div key={status} className="space-y-2">
                  <Badge className={getStatusColor(status)}>
                    {status.replace('_', ' ')}
                  </Badge>
                  <div className="text-xl font-bold">{count}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
