import { useEffect } from 'react';
import { useScannerStore } from '../store/scannerStore';

interface GlobalScannerProps {
    children?: React.ReactNode;
}

export const GlobalScanner: React.FC<GlobalScannerProps> = ({ children }) => {
    const { processScan, scanBuffer, setScanBuffer } = useScannerStore();
    useEffect(() => {
        let scanTimeout: NodeJS.Timeout;
        
        const handleGlobalKeyDown = async (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isTypingInInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                (activeElement as HTMLElement).contentEditable === 'true'
            );
            
            if (isTypingInInput) {
                return;
            }            
            if (scanTimeout) {
                clearTimeout(scanTimeout);
            }
            if (e.key === 'Enter' && scanBuffer.length > 0) {
                e.preventDefault();
                await processScan(scanBuffer);
                setScanBuffer("");
                return;
            }
            
            if (e.key === 'Escape') {
                setScanBuffer("");
                return;
            }
            
            if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) { 
                e.preventDefault();
                const newBuffer = scanBuffer + e.key;
                setScanBuffer(newBuffer);
                
                scanTimeout = setTimeout(async () => {
                    if (newBuffer.length > 2) { 
                        await processScan(newBuffer);
                        setScanBuffer("");
                    }
                }, 100);
            }
        };
        
        
        document.addEventListener('keydown', handleGlobalKeyDown, true);
        
        
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