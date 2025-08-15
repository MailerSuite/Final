import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DemoSandbox from '@/components/demo/DemoSandbox';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    children: React.ReactNode;
    demoNote?: string;
}

export const DemoModal: React.FC<DemoModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    demoNote = 'Interactive demo — write actions are disabled'
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsResetting(true);
        setTimeout(() => setIsResetting(false), 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="flex items-start justify-between">
                    <div className="flex-1">
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Demo Controls */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePlayPause}
                            className="h-8 px-3"
                        >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 px-3"
                            disabled={isResetting}
                        >
                            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Demo Banner */}
                <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-medium">Demo</span>
                        <span>{demoNote}</span>
                    </div>
                </div>

                {/* Demo Content Container */}
                <div className="relative bg-background/50 rounded-lg border overflow-hidden">
                    <div className="h-[600px] overflow-auto">
                        <DemoSandbox note={demoNote}>
                            <div className="p-4">
                                {children}
                            </div>
                        </DemoSandbox>
                    </div>
                </div>

                {/* Demo Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Demo mode active • All changes are simulated</span>
                    <span>Press ESC to close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
