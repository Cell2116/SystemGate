import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader,
    DialogDescription,
    DialogOverlay,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export default function Information() {
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        setIsOpen(true)
    }, []);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogOverlay className='fixed inset-0 bg-black bg-opacity-30 z-50' />
            <DialogContent className='max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-1/2 z-50'>
                <div className='mb-2'>
                    <DialogTitle className='text-xl font-bold mb-3'>
                        🚧 Website Under Maintenance 🚨🚨🚨
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-gray-600 space-y-3">
                            <p>
                                Sorry for the inconvenience, the Website{" "}
                                <span className="font-semibold text-blue-400">(Gate System){" "}</span>
                                is currently{" "}
                                <span className="italic font-semibold">Maintenance{" "}</span>
                                due to the error or bug.
                            </p>
                            <p>
                                We will be back to give an excellent experience for the{" "}
                                <span className="font-semibold italic text-green-700"> User</span>
                            </p>
                            <p>
                                <strong>Estimated Maintenance: </strong> Until the next information.
                            </p>
                        </div>
                    </DialogDescription>
                </div>
                <div className='flex flex-row justify-between items-end'>
                    <DialogClose asChild>
                        <Button
                            onClick={() => setIsOpen(false)}
                            type='button'
                            variant='outline'
                            className='rounded-lg bg-slate-500 text-white hover:bg-gray-400'
                        >
                            Understand
                        </Button>
                    </DialogClose>
                    <div className='flex items-center justify-center'>
                        <img
                            src="/LogoIT.jpg"
                            alt="IT Logo"
                            className='w-20 h-20 object-contain'
                            onError={(e) => {
                                
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}