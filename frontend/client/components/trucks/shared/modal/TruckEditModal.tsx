// src/components/trucks/shared/modals/TruckEditModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { CombinedTruckData} from "@/store/truckStore";
import { useFormatTime } from "@/hooks/trucks/useFormatTime";
interface TruckEditModalProps {
    truck: CombinedTruckData | null;
    isOpen: boolean;
    onClose: (open: boolean) => void;
    onSave: () => void;
    onChange: (field: keyof CombinedTruckData, value: string | null | undefined) => void;
    showSuratJalanRecommendations?: boolean;
    suratJalanRecommendations?: string[];
    onSelectSuratJalan?: (value: string) => void;
}
export default function TruckEditModal({
    truck,
    isOpen,
    onClose,
    onSave,
    onChange,
    showSuratJalanRecommendations = false,
    suratJalanRecommendations = [],
    onSelectSuratJalan
}: TruckEditModalProps) {
    const { formatTimeForInput } = useFormatTime();
    const baseurl = import.meta.env.VITE_API_BASE_URL;
    if (!truck) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Truck - {truck.platenumber}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                            <input
                                type="text"
                                value={truck.platenumber}
                                onChange={(e) => onChange('platenumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                            <input
                                type="text"
                                value={truck.driver}
                                onChange={(e) => onChange('driver', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIK Driver</label>
                            <input
                                type="text"
                                value={truck.nikdriver}
                                onChange={(e) => onChange('nikdriver', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Driver</label>
                            <input
                                type="text"
                                value={truck.tlpdriver}
                                onChange={(e) => onChange('tlpdriver', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {/* Surat Jalan field - only show for loading trucks */}
                        {showSuratJalanRecommendations && (
                            <div className="relative">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nomor Surat Jalan
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={truck.nosj || ""}
                                        onChange={(e) => {
                                            const value = e.target.value.trim().toUpperCase();
                                            onChange('nosj', value);
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value.trim().toUpperCase();
                                            onChange('nosj', value);
                                        }}
                                        style={{ textTransform: 'uppercase' }}
                                        className="surat-jalan-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contoh: SJ/VII/2093/UB"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                                value={truck.department}
                                onChange={(e) => onChange('department', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="HPC">HPC</option>
                                <option value="PT">PT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={truck.status}
                                onChange={(e) => onChange('status', e.target.value as "pending" | "weighing" | "loading" | "finished")}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Menunggu</option>
                                <option value="weighing">Timbang</option>
                                <option value="loading">Muat/Bongkar</option>
                                <option value="finished">Selesai</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Goods</label>
                            <input
                                type="text"
                                value={truck.goods}
                                onChange={(e) => onChange('goods', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input
                                type="text"
                                value={truck.supplier}
                                onChange={(e) => onChange('supplier', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                            <input
                                type="time"
                                value={formatTimeForInput(truck?.arrivaltime) || ""}
                                onChange={(e) => onChange('arrivaltime', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                            <input
                                type="time"
                                value={truck.eta || ''}
                                onChange={(e) => onChange('eta', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Truck Status</label>
                            <select
                                value={truck.statustruck}
                                onChange={(e) => onChange('statustruck', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="kosong">Kosong</option>
                                <option value="isi">Isi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Armada</label>
                            <input
                                type="text"
                                value={truck.armada}
                                onChange={(e) => onChange('armada', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                            <input
                                type="text"
                                value={truck.jenismobil}
                                onChange={(e) => onChange('jenismobil', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={truck.type}
                                onChange={(e) => onChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="internal">Internal</option>
                                <option value="external">External</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description In</label>
                            <textarea
                                rows={3}
                                value={truck.descin}
                                onChange={(e) => onChange('descin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description Out</label>
                            <textarea
                                rows={3}
                                value={truck.descout}
                                onChange={(e) => onChange('descout', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Images Section */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Captured Images</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">Driver Photo</label>
                                    {truck.driver_photo ? (
                                        <img 
                                            src={truck.driver_photo.startsWith('data:image') 
                                                ? truck.driver_photo 
                                                : `${baseurl}/uploads/trucks/${truck.driver_photo}`}
                                                // : `http://192.168.4.108:3000/uploads/trucks/${truck.driver_photo}`}
                                            alt="Driver" 
                                            className="w-full h-32 object-cover rounded-lg border mx-auto"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (nextElement) {
                                                    nextElement.style.display = 'block';
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">SIM Photo</label>
                                    {truck.sim_photo ? (
                                        <img 
                                            src={truck.sim_photo.startsWith('data:image') 
                                                ? truck.sim_photo 
                                                : `${baseurl}/uploads/trucks/${truck.sim_photo}`}
                                                // : `http://192.168.4.108:3000/uploads/trucks/${truck.sim_photo}`}
                                            alt="SIM" 
                                            className="w-full h-32 object-cover rounded-lg border mx-auto"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (nextElement) {
                                                    nextElement.style.display = 'block';
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-center">
                                    <label className="text-xs font-medium text-gray-500 block mb-2">STNK Photo</label>
                                    {truck.stnk_photo ? (
                                        <img 
                                            src={truck.stnk_photo.startsWith('data:image') 
                                                ? truck.stnk_photo 
                                                : `${baseurl}/uploads/trucks/${truck.stnk_photo}`}
                                                // : `http://192.168.4.108:3000/uploads/trucks/${truck.stnk_photo}`}
                                            alt="STNK" 
                                            className="w-full h-32 object-cover rounded-lg border mx-auto"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (nextElement) {
                                                    nextElement.style.display = 'block';
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => onClose(false)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={onSave}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}