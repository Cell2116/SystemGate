// import { useState } from "react";
// import { useScannerStore } from "../../store/scannerStore";
// import { useTrucksWithFetch } from "../../store/truckStore";

// export function ScanDebugPanel() {
//     const [testTicket, setTestTicket] = useState("");
//     const { processScan, updateTruckStatus } = useScannerStore();
//     const { trucks, refreshTrucks } = useTrucksWithFetch({});

//     const handleTestScan = async () => {
//         if (!testTicket.trim()) return;
//         console.log("🧪 Manual test scan triggered:", testTicket);
//         processScan(testTicket.trim());
//     };

//     const handleDirectUpdate = async () => {
//         if (!testTicket.trim()) return;
//         console.log("🧪 Direct truck status update triggered:", testTicket);
//         await updateTruckStatus(testTicket.trim());
//     };

//     const handleRefresh = async () => {
//         console.log("🔄 Refreshing trucks...");
//         await refreshTrucks();
//     };

//     // Find relevant trucks for debugging
//     const relevantTrucks = trucks?.filter(truck => 
//         truck.noticket.includes(testTicket) || truck.plateNumber.includes(testTicket)
//     ) || [];

//     return (
//         <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-4">
//             <h3 className="text-lg font-bold text-yellow-800 mb-3">🔧 Debug Panel (Development Only)</h3>
            
//             <div className="space-y-3">
//                 <div>
//                     <label className="block text-sm font-medium text-yellow-700 mb-1">
//                         Test Ticket Number:
//                     </label>
//                     <input
//                         type="text"
//                         value={testTicket}
//                         onChange={(e) => setTestTicket(e.target.value)}
//                         placeholder="Enter ticket number (e.g., CU2024090001)"
//                         className="w-full p-2 border border-yellow-300 rounded"
//                     />
//                 </div>

//                 <div className="flex gap-2 flex-wrap">
//                     <button
//                         onClick={handleTestScan}
//                         className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
//                         disabled={!testTicket.trim()}
//                     >
//                         🔍 Test Full Scan Process
//                     </button>
                    
//                     <button
//                         onClick={handleDirectUpdate}
//                         className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
//                         disabled={!testTicket.trim()}
//                     >
//                         ⚡ Direct Status Update
//                     </button>
                    
//                     <button
//                         onClick={handleRefresh}
//                         className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
//                     >
//                         🔄 Refresh Data
//                     </button>
//                 </div>

//                 {relevantTrucks.length > 0 && (
//                     <div className="mt-3">
//                         <h4 className="text-sm font-semibold text-yellow-700 mb-2">Matching Trucks:</h4>
//                         {relevantTrucks.map(truck => (
//                             <div key={truck.id} className="bg-white p-2 rounded border text-xs space-y-1">
//                                 <div><strong>ID:</strong> {truck.id}</div>
//                                 <div><strong>Ticket:</strong> {truck.noticket}</div>
//                                 <div><strong>Plate:</strong> {truck.plateNumber}</div>
//                                 <div><strong>Status:</strong> 
//                                     <span className={`ml-1 px-2 py-1 rounded text-xs ${
//                                         truck.status === 'Waiting' ? 'bg-gray-100' :
//                                         truck.status === 'Loading' ? 'bg-yellow-100' :
//                                         truck.status === 'Finished' ? 'bg-green-100' : 'bg-red-100'
//                                     }`}>
//                                         {truck.status}
//                                     </span>
//                                 </div>
//                                 <div><strong>Operation:</strong> {truck.operation}</div>
//                                 {truck.startLoadingTime && (
//                                     <div><strong>Start Loading:</strong> {truck.startLoadingTime}</div>
//                                 )}
//                                 {truck.finishloadingtime && (
//                                     <div><strong>Finish Time:</strong> {truck.finishloadingtime}</div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }