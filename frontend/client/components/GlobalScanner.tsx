import { useEffect } from 'react';
import { useScannerStore } from '../store/scannerStore';

interface GlobalScannerProps {
    children?: React.ReactNode;
}

export const GlobalScanner: React.FC<GlobalScannerProps> = ({ children }) => {
    const { processScan, scanBuffer, setScanBuffer } = useScannerStore();

    useEffect(() => {
        let scanTimeout: NodeJS.Timeout;
        
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const activeElement = document.activeElement;
            const isTypingInInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                (activeElement as HTMLElement).contentEditable === 'true'
            );
            
            // Skip if user is actively typing in form fields
            if (isTypingInInput) {
                return;
            }
            
            // Clear existing timeout
            if (scanTimeout) {
                clearTimeout(scanTimeout);
            }
            
            // Handle Enter key (scanner typically sends this)
            if (e.key === 'Enter' && scanBuffer.length > 0) {
                e.preventDefault();
                processScan(scanBuffer);
                setScanBuffer("");
                return;
            }
            
            // Handle Escape to clear buffer
            if (e.key === 'Escape') {
                setScanBuffer("");
                return;
            }
            
            // Accumulate characters for scanner input
            if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) { // Only alphanumeric
                e.preventDefault();
                const newBuffer = scanBuffer + e.key;
                setScanBuffer(newBuffer);
                
                // Auto-process after 100ms of no input (scanner speed)
                scanTimeout = setTimeout(() => {
                    if (newBuffer.length > 2) { // Minimum scan length
                        processScan(newBuffer);
                        setScanBuffer("");
                    }
                }, 100);
            }
        };
        
        // Add global event listener
        document.addEventListener('keydown', handleGlobalKeyDown, true);
        
        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown, true);
            if (scanTimeout) {
                clearTimeout(scanTimeout);
            }
        };
    }, [scanBuffer, processScan, setScanBuffer]);

    return <>{children}</>;
};

export default GlobalScanner;