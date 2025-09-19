// Test API connection untuk Truck Store
// File ini bisa digunakan untuk testing koneksi API setelah dummy data dihapus

import React, { useEffect, useState } from 'react';
import { useTrucksWithFetch } from '../store/truckStore';

export default function TruckAPITest() {
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const {
        trucks,
        loading,
        error,
        refetch
    } = useTrucksWithFetch();

    useEffect(() => {
        if (loading) {
            setTestStatus('testing');
        } else if (error) {
            setTestStatus('error');
            setErrorMessage(error);
        } else if (trucks.length >= 0) {
            setTestStatus('success');
        }
    }, [loading, error, trucks]);

    const handleTestAPI = () => {
        setTestStatus('testing');
        setErrorMessage('');
        refetch();
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Truck API Connection Test</h1>
            
            {/* Test Status */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <span className="font-medium">API Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        testStatus === 'idle' ? 'bg-gray-100 text-gray-800' :
                        testStatus === 'testing' ? 'bg-blue-100 text-blue-800' :
                        testStatus === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {testStatus === 'idle' && 'Ready to test'}
                        {testStatus === 'testing' && 'Testing connection...'}
                        {testStatus === 'success' && 'Connected successfully'}
                        {testStatus === 'error' && 'Connection failed'}
                    </span>
                </div>
            </div>

            {/* API Information */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">API Configuration:</h3>
                <ul className="text-sm space-y-1">
                    <li><strong>Base URL:</strong> http://192.168.4.62:3000</li>
                    <li><strong>Endpoint:</strong> /api/trucks/history</li>
                    <li><strong>Method:</strong> GET</li>
                    <li><strong>Dummy Data:</strong> Disabled (using real API)</li>
                </ul>
            </div>

            {/* Test Button */}
            <button
                onClick={handleTestAPI}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
                {loading ? 'Testing...' : 'Test API Connection'}
            </button>

            {/* Results */}
            {testStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-green-800 mb-2">✅ API Connection Successful!</h3>
                    <p className="text-green-700 text-sm mb-2">
                        Successfully fetched {trucks.length} truck records from database.
                    </p>
                    {trucks.length > 0 && (
                        <div className="text-xs text-green-600">
                            <p>Sample record: {trucks[0].plateNumber} - {trucks[0].driver}</p>
                        </div>
                    )}
                </div>
            )}

            {testStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-red-800 mb-2">❌ API Connection Failed</h3>
                    <p className="text-red-700 text-sm mb-2">Error details:</p>
                    <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                        {errorMessage}
                    </pre>
                    <div className="mt-3 text-sm text-red-700">
                        <p><strong>Common issues:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Backend server tidak running (port 3000)</li>
                            <li>Database tidak terkoneksi</li>
                            <li>Table trucks belum ada atau kosong</li>
                            <li>Network/firewall blocking request</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Trucks Data Preview */}
            {testStatus === 'success' && trucks.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Trucks Data Preview ({trucks.length} records)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left">Plate Number</th>
                                    <th className="px-3 py-2 text-left">Driver</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Operation</th>
                                    <th className="px-3 py-2 text-left">Vehicle Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trucks.slice(0, 5).map((truck) => (
                                    <tr key={truck.id} className="border-t">
                                        <td className="px-3 py-2">{truck.plateNumber}</td>
                                        <td className="px-3 py-2">{truck.driver}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                truck.status === 'Finished' ? 'bg-green-100 text-green-800' :
                                                truck.status === 'Loading' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {truck.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{truck.operation}</td>
                                        <td className="px-3 py-2">{truck.jenismobil}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {trucks.length > 5 && (
                            <p className="text-center text-gray-500 text-xs mt-2">
                                ... and {trucks.length - 5} more records
                            </p>
                        )}
                    </div>
                </div>
            )}

            {testStatus === 'success' && trucks.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">⚠️ API Connected but No Data</h3>
                    <p className="text-yellow-700 text-sm">
                        API connection successful but no truck records found in database. 
                        Please check if the trucks table has data.
                    </p>
                </div>
            )}
        </div>
    );
}