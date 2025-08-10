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
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

export function initWebSocket() {
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
        console.log("🔌 WebSocket already connected or connecting");
        return;
    }

    try {
        socket = new WebSocket("ws://localhost:3000");
        
        socket.onopen = () => {
            console.log("✅ WebSocket connected successfully");
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            
            // Clear any pending reconnect timeout
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📨 WebSocket message received:", data);
                
                // Skip info messages, only process actual data
                if (data.type !== 'info') {
                    listeners.forEach((cb) => cb(data));
                }
            } catch (error) {
                console.error("❌ Error parsing WebSocket message:", error);
            }
        };

        socket.onclose = (event) => {
            console.warn("❌ WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
            socket = null;
            
            // Attempt to reconnect if it wasn't a manual close
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                attemptReconnect();
            }
        };

        socket.onerror = (error) => {
            console.error("🚨 WebSocket error:", error);
        };

    } catch (error) {
        console.error("❌ Failed to create WebSocket connection:", error);
        attemptReconnect();
    }
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

export function closeWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (socket) {
        console.log("🧹 Manually closing WebSocket");
        socket.close(1000, "Manual close"); // 1000 = normal closure
        socket = null;
    }
    
    // Clear listeners
    listeners.length = 0;
    reconnectAttempts = 0;
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