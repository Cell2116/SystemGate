
export function startHikvisionPolling() {
    console.log('Starting Hikvision database polling...');

    // Poll setiap 2 detik
    setInterval(pollHikvisionDatabase, 2000);

    // Run immediately
    pollHikvisionDatabase();
}

// Health check endpoint
export function getPollingStatus() {
    return {
        lastProcessedSerialNo,
        isProcessing,
        pollingInterval: '2 seconds'
    };
}