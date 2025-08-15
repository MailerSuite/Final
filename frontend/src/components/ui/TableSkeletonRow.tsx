import Skeleton from "./skeleton";
import { TableCell, TableRow } from "./table";

interface SkeletonTableBodyProps {
  columns?: number;
  rows?: number;
}

export default function SkeletonTableBody({
  columns = 5,
  rows = 2,
}: SkeletonTableBodyProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
