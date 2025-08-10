

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { initWebSocket, onMessage, closeWebSocket, getConnectionStatus } from "@/lib/ws";
import Clock2 from "../components/dashboard/clock"

import { ReactNode, CSSProperties } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const Card = ({ children, className = "", style = {} }: CardProps) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`} style={style}>
    {children}
  </div>
);

type CardContentProps = {
  children: ReactNode;
  className?: string;
};

const CardContent = ({ children, className = "" }: CardContentProps) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);


export default function EmployeeDashboard() {
  const { 
    records, 
    loading, 
    error, 
    connectionStatus,
    fetchRecords, 
    addRecord, 
    updateRecord,
    updateRecordByUid,
    setConnectionStatus,
    setError
  } = useDashboardStore();

  useEffect(() => {
    let mounted = true;
    let statusCheckInterval: NodeJS.Timeout;

    const setupRealTimeConnection = async () => {
      try {
        console.log("🚀 Setting up real-time dashboard connection...");
        
        // 1. Set initial connection status
        setConnectionStatus('connecting');

        // 2. Initialize WebSocket
        initWebSocket();

        // 3. Setup WebSocket message handler
        onMessage((data) => {
          if (!mounted) return;
          
          console.log("📨 WebSocket message received:", data);

          // Skip info/system messages
          if (data.type === 'info') {
            console.log("ℹ️ System message:", data.message);
            setConnectionStatus('connected');
            return;
          }

          // Validate required fields
          if (!data.licenseplate || !data.name || !data.department) {
            console.warn("⚠️ Invalid WebSocket data (missing required fields):", data);
            return;
          }

          // Handle different types of real-time updates
          switch (data.type) {
            case 'entry':
              console.log("🚪 Processing entry record:", data.uid);
              addRecord({
                id: data.id || Date.now(),
                uid: data.uid,
                name: data.name,
                department: data.department,
                licenseplate: data.licenseplate,
                image_path: data.image_path,
                datein: data.datein || new Date().toISOString(),
                dateout: null,
                status: 'entry'
              });
              break;

            case 'exit':
              console.log("🚪 Processing exit record:", data.uid);
              const exitUpdates: any = {
                dateout: data.dateout || new Date().toISOString(),
                status: 'exit'
              };
              if (data.image_path_out) {
                exitUpdates.image_path_out = data.image_path_out;
              }
              if (data.id) {
                updateRecord(data.id, exitUpdates);
              } else {
                // Fallback: update by UID if no ID provided
                updateRecordByUid(data.uid, exitUpdates);
              }
              break;

            case 'image_update':
              console.log("📸 Processing image update:", data.uid);
              if (data.id) {
                updateRecord(data.id, {
                  image_path: data.image_path
                });
              } else {
                updateRecordByUid(data.uid, {
                  image_path: data.image_path
                });
              }
              break;

            default:
              // Handle legacy format or unknown types as new entries
              console.log("📝 Processing unknown/legacy format as new entry");
              addRecord({
                id: data.id || Date.now(),
                uid: data.uid,
                name: data.name,
                department: data.department,
                licenseplate: data.licenseplate,
                image_path: data.image_path,
                datein: data.datein || new Date().toISOString(),
                dateout: data.dateout,
                status: data.status || 'entry'
              });
          }

          // Update connection status on successful message processing
          setConnectionStatus('connected');
          setError(null);
        });

        // 4. Fetch initial data
        await fetchRecords();
        console.log("📥 Initial data loaded successfully");

        // 5. Setup periodic connection status check
        statusCheckInterval = setInterval(() => {
          if (!mounted) return;
          
          const wsStatus = getConnectionStatus();
          if (wsStatus === 'open') {
            setConnectionStatus('connected');
          } else if (wsStatus === 'connecting') {
            setConnectionStatus('connecting');
          } else {
            setConnectionStatus('error');
          }
        }, 5000); // Check every 5 seconds

        console.log("✅ Real-time dashboard setup complete");

      } catch (error) {
        console.error("❌ Failed to setup real-time connection:", error);
        setConnectionStatus('error');
        setError(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    // Initialize the connection
    setupRealTimeConnection();

    // Cleanup function
    return () => {
      mounted = false;
      console.log("🧹 Cleaning up dashboard connections...");
      
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      
      closeWebSocket();
      setConnectionStatus('disconnected');
    };
  }, []); // Empty dependency array - only run once on mount

  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: '🟢', text: 'Live', color: 'text-green-600' };
      case 'connecting':
        return { icon: '🟡', text: 'Connecting...', color: 'text-yellow-600' };
      case 'error':
        return { icon: '🔴', text: 'Connection Error', color: 'text-red-600' };
      default:
        return { icon: '⚪', text: 'Disconnected', color: 'text-gray-600' };
    }
  };

  const status = getStatusIndicator();

  return (
    <div className="h-screen flex flex-col space-y-4 overflow-hidden bg-gray-50 p-4">
      {/* Header */}
      <div className="z-10 sticky top-0 pb-2 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Gate Record</h1>
            <p className="mt-1 text-sm text-gray-500">
              Real-time employee data recorded at the gate
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <div className={`text-sm font-medium ${status.color} flex items-center gap-1`}>
              <span>{status.icon}</span>
              <span>{status.text}</span>
            </div>
            <div className="text-xs text-gray-500">
              {records.length} records
            </div>
            <Clock2 />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card 
        style={{ 
          transform: "scale(0.70)", 
          transformOrigin: "top left", 
          width: "142.8%", 
          height: "142.8%" 
        }} 
        className="flex-1 overflow-hidden"
      >
        <CardContent className="h-full overflow-y-auto space-y-4 p-4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-500">Loading employee records...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 flex items-center gap-2">
                  <span>❌</span>
                  <span>{error}</span>
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && records.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">🚪</div>
                <p className="text-gray-500 text-lg">No attendance records yet</p>
                <p className="text-gray-400 text-sm">Records will appear here when employees scan their RFID cards</p>
              </div>
            </div>
          )}

          {/* Records List */}
          {records.map((record, index) => (
            <Card 
              key={`${record.uid}-${record.id}-${index}`}
              className={`w-full transition-all duration-500 hover:shadow-md ${
                index === 0 ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:text-2xl sm:text-sm gap-4 w-full">
                  {/* Vehicle Image */}
                  <div className="w-full lg:w-1/4 flex justify-center">
                    <div className="relative">
                      <h1 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold">Tap In</h1>
                      <img
                        src={record.image_path 
                          ? `http://localhost:3000/uploads/${record.image_path}` 
                          : "https://via.placeholder.com/150x150?text=Vehicle"
                        }
                        alt="vehicle"
                        className="h-32 w-32 object-cover text-gray-300 text-center rounded-lg border shadow-sm"
                        // onError={(e) => {
                        //   e.currentTarget.src = "https://via.placeholder.com/150x150?text=No+Image";
                        // }}
                      />
                      {index === 0 && (
                        <div className="absolute -top-2 -right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Latest
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Person Image (image_path_out) */}
                  <div className="w-full lg:w-1/4 flex justify-center">
                    <div className="relative">
                    <h1 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold">Tap Out</h1>
                    <img
                      src={record.image_path_out
                        ? `http://localhost:3000/uploads/${record.image_path_out}`
                        : "https://via.placeholder.com/150x150?text=Person"
                      }
                      alt="person"
                      className="h-32 w-32 object-cover text-gray-300 text-center rounded-lg border shadow-sm"
                      />
                      </div>
                  </div>

                  {/* Main Data */}
                  <div className="w-full lg:w-1/4 flex flex-col text-left space-y-2 ">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold lg:text-2xl sm:text-sm text-blue-600">
                        {record.licenseplate}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'entry' ? 'bg-green-100 text-green-800' :
                        record.status === 'exit' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-900">{record.name}</span>
                    </p>
                    
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span className="ml-2 text-gray-900">{record.department}</span>
                    </p>
                    
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Entry:</span>
                      <span className="ml-2 text-green-700 font-mono">
                        {new Date(record.datein).toLocaleString("id-ID")}
                      </span>
                    </p>
                    
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Exit:</span>
                      <span className={`ml-2 font-mono ${
                        record.dateout ? 'text-red-700' : 'text-gray-400'
                      }`}>
                        {record.dateout ? new Date(record.dateout).toLocaleString("id-ID") : "Still inside"}
                      </span>
                    </p>
                  </div>

                  {/* Leave Permission Section */}
                  <div className="w-full lg:w-1/4 flex flex-col text-left space-y-2">
                    <p className="font-bold lg:text-xl sm:text-sm text-purple-600 mb-2">Leave Permission</p>
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Exit Time:</span>
                      <span className="ml-2 text-gray-700">13:34 | 26 Juli 2025</span>
                    </p>
                    <p className="lg:text-xl sm:text-sm">
                      <span className="font-medium text-gray-600">Return Time:</span>
                      <span className="ml-2 text-gray-700">14:34 | 26 Juli 2025</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}