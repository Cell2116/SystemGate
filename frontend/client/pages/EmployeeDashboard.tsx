import { useEffect, useState, useRef, useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { initWebSocket, onMessage, closeWebSocket, getConnectionStatus, onConnectionChange, onDataChange } from "@/lib/ws";
import { useAudio } from "@/hooks/useAudio";
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
interface ExtendedAttendance {
  id: number;
  uid: string;
  name: string;
  department: string;
  licenseplate: string;
  image_path?: string;
  image_path_out?: string;
  image_path_leave_exit?: string;
  image_path_leave_return?: string;
  datein: string;
  dateout?: string | null;
  status?: string;
  leave_permission_id?: number | null;
  leave_reason?: string | null;
  planned_exit_time?: string | null;
  planned_return_time?: string | null;
  actual_exittime?: string | null;
  actual_returntime?: string | null;
}

export default function EmployeeDashboard() {
  const { playDingDongBell } = useAudio();
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
    setError,
    leavePermissions,
    fetchLeavePermission,
    addLeavePermission,
  } = useDashboardStore();

  // Function to get the last activity timestamp for sorting
  const getLastActivity = (record: ExtendedAttendance) => {
    const timestamps = [
      new Date(record.datein).getTime(),
      record.dateout ? new Date(record.dateout).getTime() : 0,
      record.actual_exittime ? new Date(record.actual_exittime).getTime() : 0,
      record.actual_returntime ? new Date(record.actual_returntime).getTime() : 0
    ].filter(t => t > 0);
    
    return Math.max(...timestamps);
  };

  // Filter and sort records with memoization for performance
  const sortedAndFilteredRecords = useMemo(() => {
    const now = new Date();
    
    // Filter: hanya tampilkan data yang BELUM 24 jam ATAU BELUM keluar
    const filtered = records.filter((record: ExtendedAttendance) => {
      const dateIn = new Date(record.datein);
      const isLessThan24h = (now.getTime() - dateIn.getTime()) < 24 * 60 * 60 * 1000;
      const notExited = !record.dateout && !record.actual_returntime;
      // Tampilkan jika masih <24 jam ATAU belum keluar
      return isLessThan24h || notExited;
    });
    
    // Sort by last activity (most recent first)
    return [...filtered].sort((a, b) => {
      const lastActivityA = getLastActivity(a);
      const lastActivityB = getLastActivity(b);
      return lastActivityB - lastActivityA;
    });
  }, [records]);

  const recordsCountRef = useRef(0);
  
  // Monitor perubahan jumlah records untuk memainkan suara
  // Disabled karena audio sudah dimainkan di onMessage untuk setiap tap card action
  // useEffect(() => {
  //   const currentCount = sortedAndFilteredRecords.length;
  //   
  //   // Jika ada penambahan record baru (count bertambah)
  //   if (recordsCountRef.current > 0 && currentCount > recordsCountRef.current) {
  //     // console.log(`Records increased from ${recordsCountRef.current} to ${currentCount} - playing sound`);
  //     playDingDongBell();
  //   }
  //   
  //   recordsCountRef.current = currentCount;
  // }, [sortedAndFilteredRecords, playDingDongBell]);
  const formatCustomDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    
    let date: Date;
    if (dateString.includes('T')) {
      const [datePart, timePart] = dateString.split('T');
      const timeOnly = timePart.split('.')[0];
      const cleanDateString = `${datePart} ${timeOnly}`;
      date = new Date(cleanDateString);
    } else if (dateString.includes(' ')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
  };

  const formatLocalDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const formatted = date.toLocaleString("id-ID", {
    timeZone: "UTC",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });  
  return formatted;
};

  useEffect(() => {
    let mounted = true;
    let unsubscribeDataChange: (() => void) | null = null;
    let unsubscribeLeaveChange: (() => void) | null = null;

    const setupRealTimeConnection = async () => {
      try {
        //console.log("Setting up real-time connection...");
        setConnectionStatus('connecting');        
        onConnectionChange((status) => {
          if (!mounted) return;
         //console.log("WebSocket connection status changed:", status);
          
          switch (status) {
            case 'open':
              setConnectionStatus('connected');
              setError(null);
              break;
            case 'connecting':
              setConnectionStatus('connecting');
              break;
            case 'closed':
            case 'closing':
              setConnectionStatus('error');
              break;
          }
        });
          unsubscribeDataChange = onDataChange('attendance', (data) => {
          if (!mounted) return;
          // console.log("Global attendance data change received:", data);
          // console.log("About to call fetchRecords...");          
          if (data.leaveInfo || data.leave_permission_id) {
            // console.log("Leave permission data in global change:", {
            //   leaveInfo: data.leaveInfo,
            //   leave_permission_id: data.leave_permission_id,
            //   leave_reason: data.leave_reason,
            //   planned_exit_time: data.planned_exit_time,
            //   planned_return_time: data.planned_return_time,
            //   actual_exittime: data.actual_exittime,
            //   actual_returntime: data.actual_returntime
            // });
          }          
          // console.log("Force refreshing records due to global data change");
          setTimeout(() => {
            if (mounted) {
              // console.log("Calling fetchRecords NOW...");
              fetchRecords();
            }
          }, 100);
        });
        
        unsubscribeLeaveChange = onDataChange('leave_permission', (data) => {
          if (!mounted) return;
          
          // console.log("Global leave permission data change received:", data);
          // console.log("About to call fetchRecords and fetchLeavePermission...");          
          setTimeout(() => {
            if (mounted) {
              // console.log("Calling fetchRecords and fetchLeavePermission NOW...");
              fetchRecords();
              fetchLeavePermission();
            }
          }, 100);
        });

        initWebSocket();
        await fetchLeavePermission();
        onMessage((data) => {
          if (!mounted) return;
          
          // console.log("WebSocket message received in dashboard:", data);
          // console.log("Current records count before processing:", recordsCountRef.current);
          
          if (data.type === 'info') {
            // console.log("ℹReceived info message, updating connection status");
            setConnectionStatus('connected');
            setError(null);
            return;
          }
          
          if (!data.licenseplate || !data.name || !data.department) {
            // console.warn("Invalid WebSocket data:", data);
            return;
          }
          
          // console.log("Processing message type:", data.type, "for UID:", data.uid);
          
          switch (data.type) {
            case 'entry':
              // console.log("Processing entry record:", data.uid);
              const entryRecord = {
                id: data.id || Date.now(),
                uid: data.uid,
                name: data.name,
                department: data.department,
                licenseplate: data.licenseplate,
                image_path: data.image_path,
                datein: data.datein || new Date().toISOString(),
                dateout: null,
                status: 'entry',
                leave_permission_id: data.leaveInfo?.permissionId || null,
                leave_reason: data.leaveInfo?.reason || null,
                planned_exit_time: data.leaveInfo?.plannedExitTime || null,
                planned_return_time: data.leaveInfo?.plannedReturnTime || null,
                actual_exittime: data.leaveInfo?.actualExitTime || null,
                actual_returntime: data.leaveInfo?.actualReturnTime || null,
              } as ExtendedAttendance;
              // console.log("Adding entry record:", entryRecord);
              addRecord(entryRecord);
              // Play ding dong sound when new entry is added
              playDingDongBell();
              break;

            case 'exit':
            case 'leave_exit':
            case 'leave_return':
              // console.log(`Processing ${data.type} - will be handled by global data change`);
              // Play ding dong sound for all tap card actions
              playDingDongBell();
              break;
            
            case 'image_update':
              // console.log(`Processing ${data.type} - will be handled by global data change`);
              break;

            default:
              // console.log("Processing unknown format as new entry");
              const defaultRecord = {
                id: data.id || Date.now(),
                uid: data.uid,
                name: data.name,
                department: data.department,
                licenseplate: data.licenseplate,
                image_path: data.image_path,
                datein: data.datein || new Date().toISOString(),
                dateout: data.dateout,
                status: data.status || 'entry',
                leave_permission_id: data.leave_permission_id || null,
                leave_reason: data.leave_reason || null,
                planned_exit_time: data.planned_exit_time || null,
                planned_return_time: data.planned_return_time || null,
                actual_exittime: data.actual_exittime || null,
                actual_returntime: data.actual_returntime || null,
              } as ExtendedAttendance;
              // console.log("Adding default record:", defaultRecord);
              addRecord(defaultRecord);
              playDingDongBell();
          }
          setConnectionStatus('connected');
          setError(null);
        });

        await fetchRecords();
      } catch (error) {
        // console.error("❌ Error in setupRealTimeConnection:", error);
        setConnectionStatus('error');
        setError(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    setupRealTimeConnection();

    return () => {
      mounted = false;
      if (unsubscribeDataChange) {
        unsubscribeDataChange();
      }
      if (unsubscribeLeaveChange) {
        unsubscribeLeaveChange();
      }
      closeWebSocket();
      setConnectionStatus('disconnected');
    };
  }, []);

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

  const [modalImage, setModalImage] = useState<string | null>(null);
  const status = getStatusIndicator();
  return (
    <>
      <div className="h-[120vh] flex flex-col space-y-4 overflow-hidden bg-gray-50 p-3">
        {/* Header */}
        <div className="z-10 sticky top-0 pb-2 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Employee Gate Record</h1>
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
                {sortedAndFilteredRecords.length} records
              </div>
              {/* <div className="w-fit">
              <Clock2 />
              </div> */}
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
            {sortedAndFilteredRecords.map((record: ExtendedAttendance, index) => {
              // Check if this is the most recent activity
              const isLatestActivity = index === 0;
              
              return (
              <Card 
                key={`${record.uid}-${record.id}-${index}`}
                className={`w-full transition-all duration-500 hover:shadow-md ${
                  isLatestActivity ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between lg:text-2xl sm:text-sm gap-4 w-full">
              
                    {/* SECTION 1: Vehicle/Person Images */}
                    <div className="w-full lg:w-1/4 flex flex-col gap-4">
                    <div className="w-full flex flex-row gap-4 justify-center">
                      {/* Entry Image */}
                      <div className="flex flex-col items-center">
                        <h3 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold text-green-600">
                          Entry Photo
                        </h3>
                        <img
                          src={record.image_path 
                            ? `http://192.168.10.27:3000/uploads/${record.image_path}` 
                            : "https://via.placeholder.com/150x150?text=No+Photo"
                          }
                          alt="entry"
                          className="h-[15vh] w-[40vw] md:h-[17vh] md:w-[10vw] xl:h-[17vh] xl:w-[10vw] object-cover rounded-lg border shadow-sm text-gray-300 border-none text-center cursor-pointer"
                          onClick={() => {
                            if (record.image_path)
                              setModalImage(`http://192.168.10.27:3000/uploads/${record.image_path}`);
                          }}
                        />
                      </div>
                      
                      {/* Exit/Leave Image */}
                      <div className="flex flex-col items-center">
                        <h3 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold text-red-600">
                          Exit Photo
                        </h3>
                        <img
                          src={record.image_path_out
                            ? `http://192.168.10.27:3000/uploads/${record.image_path_out}`
                            : "https://via.placeholder.com/150x150?text=No+Photo"
                          }
                          alt="exit"
                          className="h-[15vh] w-[40vw] md:h-[17vh] md:w-[10vw] xl:h-[17vh] xl:w-[10vw] object-cover rounded-lg border shadow-sm cursor-pointer text-gray-300 border-none text-center"
                          onClick={() => {
                            if (record.image_path_out)
                              setModalImage(`http://192.168.10.27:3000/uploads/${record.image_path_out}`);
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-full flex flex-row gap-4 justify-center">
                      {/* Leave Exit IMage */}
                      <div className="flex flex-col items-center">
                        <h3 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold text-green-600">
                          Leave Exit Photo
                        </h3>
                        <img
                          src={record.image_path_leave_exit
                            ? `http://192.168.10.27:3000/uploads/${record.image_path_leave_exit}`
                            : "https://via.placeholder.com/150x150?text=No+Photo"
                          }
                          alt="leave_exit"
                          className="h-[15vh] w-[40vw] md:h-[17vh] md:w-[10vw] xl:h-[17vh] xl:w-[10vw] object-cover rounded-lg border shadow-sm cursor-pointer text-gray-300 border-none text-center"
                          onClick={() => {
                            if (record.image_path_leave_exit)
                              setModalImage(`http://192.168.10.27:3000/uploads/${record.image_path_leave_exit}`);
                          }}
                        />
                      </div>
                      {/* Leave Return Imagee */}
                      <div className="flex flex-col items-center">
                        <h3 className="text-center pb-1 lg:text-xl sm:text-sm font-semibold text-red-600">
                          Leave Return Photo
                        </h3>
                        <img
                          src={record.image_path_leave_return
                            ? `http://192.168.10.27:3000/uploads/${record.image_path_leave_return}`
                            : "https://via.placeholder.com/150x150?text=No+Photo"
                          }
                          alt="leave_return"
                          className="h-[15vh] w-[40vw] md:h-[17vh] md:w-[10vw] xl:h-[17vh] xl:w-[10vw] object-cover rounded-lg border shadow-sm cursor-pointer text-gray-300 border-none text-center"
                          onClick={() => {
                            if (record.image_path_leave_return)
                              setModalImage(`http://192.168.10.27:3000/uploads/${record.image_path_leave_return}`);
                          }}
                        />
                      </div>
                    </div>
                    </div>

                    {/* SECTION 2: Basic Attendance Info (License Plate, Name, Department, Entry, Exit) */}
                    <div className="w-full lg:w-1/4 flex flex-col text-left space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold lg:text-2xl sm:text-sm text-blue-600">
                          {record.licenseplate}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'entry' ? 'bg-green-100 text-green-800' :
                          record.status === 'exit' ? 'bg-red-100 text-red-800' :
                          record.status === 'leave_exit' ? 'bg-orange-100 text-orange-800' :
                          record.status === 'leave_return' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status === 'leave_exit' ? 'LEAVE EXIT' :
                          record.status === 'leave_return' ? 'LEAVE RETURN' :
                          record.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        {isLatestActivity && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                            LATEST ACTIVITY
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Name:</span>
                        <span className="ml-2 text-gray-900 lg:text-xl sm:text-sm">{record.name}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Department:</span>
                        <span className="ml-2 text-gray-900 lg:text-xl sm:text-sm">{record.department}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Entry:</span>
                        <span className="ml-2 text-green-700 font-mono lg:text-xl sm:text-sm">
                          {formatLocalDateTime(record.datein)}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Exit:</span>
                        <span className={`ml-2 font-mono lg:text-xl sm:text-sm ${
                          record.dateout ? 'text-red-700' : 'text-gray-400'
                        }`}>
                          {record.dateout ? formatLocalDateTime(record.dateout) : "Still inside"}
                        </span>
                      </div>
                    </div>

                    {/* SECTION 3: Leave Permission Details */}
                    <div className="w-full lg:w-1/4 flex flex-col text-left space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold lg:text-xl sm:text-sm text-purple-600">Leave Permission</p>
                        {record.leave_permission_id && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            APPROVED
                          </span>
                        )}
                      </div>
                      
                      {record.leave_permission_id ? (
                        <>
                          <div>
                            <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Reason:</span>
                            <span className="ml-2 text-gray-700 lg:text-xl sm:text-sm">
                              {record.leave_reason || "N/A"}
                            </span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Planned Exit:</span>
                            <span className="ml-2 text-blue-700 font-mono lg:text-xl sm:text-sm">
                              {formatCustomDateTime(record.planned_exit_time) || "N/A"}
                            </span>
                          </div>
                                              
                          <div>
                            <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Planned Return:</span>
                            <span className="ml-2 text-blue-700 font-mono lg:text-xl sm:text-sm">
                              {formatCustomDateTime(record.planned_return_time) || "N/A"}
                            </span>
                          </div>
                                              
                          <div>
                            <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Actual Exit:</span>
                            <span className={`ml-2 font-mono lg:text-xl sm:text-sm ${
                              record.actual_exittime ? 'text-green-700' : 'text-gray-400'
                            }`}>
                              {formatLocalDateTime(record.actual_exittime) || "Not used yet"}
                            </span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600 lg:text-xl sm:text-sm">Actual Return:</span>
                            <span className={`ml-2 font-mono lg:text-xl sm:text-sm ${
                              record.actual_returntime ? 'text-green-700' : 'text-gray-400'
                            }`}>
                              {formatLocalDateTime(record.actual_returntime) || "Not returned yet"}
                            </span>
                          </div>
                          
                          {/* Leave Status */}
                          <div className="mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              record.actual_returntime ? 'bg-green-100 text-green-800' :
                              record.actual_exittime ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.actual_returntime ? 'Leave Completed' :
                              record.actual_exittime ? 'Currently On Leave' :
                              'Leave Approved (Not Used)'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 lg:text-xl sm:text-sm">
                          No leave permission for this record
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </CardContent>
        </Card>
      </div>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Full Preview"
            className="max-h-[100vh] max-w-[100vw] rounded-lg shadow-2xl border-4 border-white"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full px-3 py-1"
            onClick={() => setModalImage(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}