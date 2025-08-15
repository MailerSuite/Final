import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-white border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
            </button>

            <span className="text-sm text-foreground">
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-white border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
            </button>
        </div>
    );
};

export default Pagination; 