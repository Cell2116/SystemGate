// Simple weighing component for truck weighing workflow
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Truck, CheckCircle } from 'lucide-react';

interface WeighingStepProps {
    truck: any;
    onComplete: () => void;
    onCancel: () => void;
}

export default function WeighingStep({ truck, onComplete, onCancel }: WeighingStepProps) {
    const [isWeighing, setIsWeighing] = useState(false);

    const handleStartWeighing = () => {
        setIsWeighing(true);
        // Simulate weighing process
        setTimeout(() => {
            setIsWeighing(false);
            onComplete();
        }, 3000);
    };

    return (
        <div className="max-w-md mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                        <Scale className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Proses Penimbangan</CardTitle>
                    <CardDescription>
                        Truck dengan plat nomor <strong>{truck.plateNumber}</strong> siap untuk ditimbang
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Driver:</span>
                            <span className="font-medium">{truck.driver}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Supplier:</span>
                            <span className="font-medium">{truck.supplier}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Jenis Mobil:</span>
                            <span className="font-medium">{truck.jenismobil}</span>
                        </div>
                    </div>

                    {!isWeighing ? (
                        <div className="space-y-3">
                            <Button 
                                onClick={handleStartWeighing}
                                className="w-full bg-blue-500 hover:bg-blue-600"
                                size="lg"
                            >
                                <Scale className="w-4 h-4 mr-2" />
                                Mulai Timbang
                            </Button>
                            <Button 
                                onClick={onCancel}
                                variant="outline"
                                className="w-full"
                            >
                                Batal
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-3">
                            <div className="animate-spin mx-auto">
                                <Scale className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600">Sedang menimbang...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}