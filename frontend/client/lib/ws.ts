// // src/lib/ws.ts
// let socket: WebSocket | null = null;
// const listeners: ((data: any) => void)[] = [];

// export function initWebSocket() {
//   if (!socket || socket.readyState === WebSocket.CLOSED) {
//     socket = new WebSocket("ws://localhost:3000");

//     socket.onopen = () => {
//       console.log("🔌 WebSocket connected");
//     };

//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       listeners.forEach((cb) => cb(data));
//     };

//     socket.onclose = () => {
//       console.warn("❌ WebSocket disconnected");
//       // Optionally reconnect
//     };
//   }
// }

// export function onMessage(callback: (data: any) => void) {
//   listeners.push(callback);
// }

// export function closeWebSocket() {
//   socket?.close();
// }


// src/lib/ws.ts
let socket: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];
// Add connection status listeners
const connectionListeners: ((status: 'connecting' | 'open' | 'closing' | 'closed') => void)[] = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Add global data change listeners for different data types
const dataChangeListeners: {
    [key: string]: ((data: any) => void)[]
} = {
    attendance: [],
    leave_permission: [],
    trucks: [],
};

export function initWebSocket() {
    console.log("🔍 initWebSocket called, current socket state:", socket?.readyState);
    
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
        console.log("🔌 WebSocket already connected or connecting");
        return;
    }

    try {
        console.log("🚀 Creating new WebSocket connection to ws://localhost:3000");
        socket = new WebSocket("ws://192.168.4.62:3000");
        
        console.log("📡 WebSocket created, readyState:", socket.readyState);
        
        // Notify connection status change
        notifyConnectionListeners('connecting');
        
        socket.onopen = () => {
            console.log("✅ WebSocket connected successfully");
            reconnectAttempts = 0;
            
            // Notify connection status change
            notifyConnectionListeners('open');
            
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                console.log("📨 Raw WebSocket message:", event.data);
                const data = JSON.parse(event.data);
                console.log("📨 Parsed WebSocket message:", data);
                
                // Process all messages, let the dashboard decide what to do with them
                listeners.forEach((cb) => {
                    try {
                        cb(data);
                    } catch (error) {
                        console.error("❌ Error in message listener:", error);
                    }
                });

                // Broadcast data changes to global listeners based on data type
                broadcastDataChange(data);
            } catch (error) {
                console.error("❌ Error parsing WebSocket message:", error, "Raw data:", event.data);
            }
        };

        socket.onclose = (event) => {
            console.warn("❌ WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
            socket = null;
            
            // Notify connection status change
            notifyConnectionListeners('closed');
            
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                attemptReconnect();
            }
        };

        socket.onerror = (error) => {
            console.error("🚨 WebSocket error:", error);
            notifyConnectionListeners('closed');
        };

    } catch (error) {
        console.error("❌ Failed to create WebSocket connection:", error);
        notifyConnectionListeners('closed');
        attemptReconnect();
    }
}

// Add function to notify connection listeners
function notifyConnectionListeners(status: 'connecting' | 'open' | 'closing' | 'closed') {
    connectionListeners.forEach((cb) => {
        try {
            cb(status);
        } catch (error) {
            console.error("❌ Error in connection listener:", error);
        }
    });
}

function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached`);
        return;
    }

    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
    
    console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${delay}ms...`);
    
    reconnectTimeout = setTimeout(() => {
        initWebSocket();
    }, delay);
}

export function onMessage(callback: (data: any) => void) {
    listeners.push(callback);
    console.log(`📝 Added message listener. Total listeners: ${listeners.length}`);
}

// Add function to listen to connection status changes
export function onConnectionChange(callback: (status: 'connecting' | 'open' | 'closing' | 'closed') => void) {
    connectionListeners.push(callback);
    console.log(`🔗 Added connection listener. Total connection listeners: ${connectionListeners.length}`);
}

// Add function to broadcast data changes globally
function broadcastDataChange(data: any) {
    try {
        let dataTypes: string[] = ['attendance']; // default, always broadcast as attendance
        
        // Determine data type based on message content
        if (data.type === 'leave_permission' || 
            data.leaveInfo || 
            data.leave_permission_id ||
            data.leave_reason ||
            data.planned_exit_time ||
            data.planned_return_time ||
            data.actual_exittime ||
            data.actual_returntime ||
            data.type === 'leave_exit' ||
            data.type === 'leave_return' ||
            data.statusFromHR ||
            data.statusFromDepartment ||
            data.statusFromDirector ||
            data.approval) {
            dataTypes.push('leave_permission');
        }
        
        if (data.type === 'truck' || data.vehicle_type) {
            dataTypes.push('trucks');
        }
        
        // Broadcast to all relevant data types
        dataTypes.forEach(dataType => {
            console.log(`📢 Broadcasting ${dataType} data change to ${dataChangeListeners[dataType]?.length || 0} listeners`);
            
            // Notify all listeners for this data type
            (dataChangeListeners[dataType] || []).forEach((cb) => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`❌ Error in ${dataType} data change listener:`, error);
                }
            });
        });
    } catch (error) {
        console.error("❌ Error in broadcastDataChange:", error);
    }
}

// Add function to subscribe to global data changes
export function onDataChange(dataType: 'attendance' | 'leave_permission' | 'trucks', callback: (data: any) => void) {
    if (!dataChangeListeners[dataType]) {
        dataChangeListeners[dataType] = [];
    }
    
    dataChangeListeners[dataType].push(callback);
    console.log(`📋 Added ${dataType} data listener. Total ${dataType} listeners: ${dataChangeListeners[dataType].length}`);
    
    // Return unsubscribe function
    return () => {
        const index = dataChangeListeners[dataType].indexOf(callback);
        if (index > -1) {
            dataChangeListeners[dataType].splice(index, 1);
            console.log(`🗑️ Removed ${dataType} data listener. Remaining ${dataType} listeners: ${dataChangeListeners[dataType].length}`);
        }
    };
}

export function closeWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (socket) {
        console.log("🧹 Manually closing WebSocket");
        socket.close(1000, "Manual close");
        socket = null;
    }
    
    // Clear all listeners
    listeners.length = 0;
    connectionListeners.length = 0;
    reconnectAttempts = 0;
    
    // Clear all data change listeners
    Object.keys(dataChangeListeners).forEach(key => {
        dataChangeListeners[key].length = 0;
    });
}

export function getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!socket) return 'closed';
    
    switch (socket.readyState) {
        case WebSocket.CONNECTING: return 'connecting';
        case WebSocket.OPEN: return 'open';
        case WebSocket.CLOSING: return 'closing';
        case WebSocket.CLOSED: return 'closed';
        default: return 'closed';
    }
}

export function isConnected(): boolean {
    return socket?.readyState === WebSocket.OPEN;
}