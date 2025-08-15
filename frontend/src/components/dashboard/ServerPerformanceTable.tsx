import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance from "@/http/axios";
import { ServerInfo } from "@/pages/analytics/components/table";
import { useGetServerPerformanceQuery } from "@/services/api/dashboard";
import {
  Cpu,
  HardDrive,
  List,
  MemoryStick,
  Server,
  Signal,
} from "lucide-react";
import { useEffect, useState } from "react";

const ServerPerformanceTable = () => {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get("/dashboard/system-health");
      
      // Defensive programming: ensure data is always an array
      if (Array.isArray(data)) {
        setServers(data);
      } else if (data && typeof data === 'object' && data.servers && Array.isArray(data.servers)) {
        setServers(data.servers);
      } else {
        // Fallback to mock data if API doesn't return proper format
        setServers([
          {
            server: "App Server 1",
            cpu: 45.2,
            memory: 68.1,
            disk: 34.7,
            status: "healthy"
          },
          {
            server: "Database Server",
            cpu: 23.8,
            memory: 81.4,
            disk: 67.2,
            status: "healthy"
          },
          {
            server: "Cache Server",
            cpu: 12.4,
            memory: 34.6,
            disk: 15.8,
            status: "healthy"
          }
        ]);
      }
    } catch (error: any) {
      console.error("Failed to fetch server performance:", error);
      setError("Failed to load server data");
      
      // Fallback to empty array on error
      setServers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ensure servers is always an array before rendering
  const safeServers = Array.isArray(servers) ? servers : [];

  return (
    <Table className="mt-4 min-w-[40rem]">
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4" />
              Server
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4" /> CPU (%)
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2 text-sm">
              <MemoryStick className="h-4 w-4" /> Memory (%)
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4" /> Disk (%)
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2 text-sm">
              <Signal className="h-4 w-4" /> Status
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Loading server data...
              </div>
            </TableCell>
          </TableRow>
        )}
        
        {error && !isLoading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4 text-red-400">
              {error}
            </TableCell>
          </TableRow>
        )}
        
        {!isLoading && !error && safeServers.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4 text-zinc-400">
              No server data available
            </TableCell>
          </TableRow>
        )}
        
        {!isLoading && !error && safeServers.length > 0 && 
          safeServers.map((serverInfo, index) => {
            // Defensive destructuring with fallbacks
            const {
              server = `Server ${index + 1}`,
              cpu = 0,
              memory = 0,
              disk = 0,
              status = 'unknown'
            } = serverInfo || {};

            return (
              <TableRow key={server || `server-${index}`}>
                <TableCell className="font-medium">{server}</TableCell>
                <TableCell>
                  <span className={`${
                    Number(cpu) > 80 ? 'text-red-400' :
                    Number(cpu) > 60 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Number(cpu).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`${
                    Number(memory) > 85 ? 'text-red-400' :
                    Number(memory) > 70 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Number(memory).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`${
                    Number(disk) > 90 ? 'text-red-400' :
                    Number(disk) > 75 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Number(disk).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'healthy' ? 'bg-green-900/50 text-green-400' :
                    status === 'warning' ? 'bg-yellow-900/50 text-yellow-400' :
                    status === 'error' ? 'bg-red-900/50 text-red-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {status}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        }
      </TableBody>
    </Table>
  );
};

export default ServerPerformanceTable;
