import axiosInstance from "@/http/axios";

/** System health status response */
export interface SystemHealthResponse {
  database: {
    status: string;
    error?: string;
  };
  services: {
    api: {
      status: string;
      uptime: string;
    };
    database: {
      status: string;
      connections: number;
    };
    redis: {
      status: string;
      memory_usage: string;
    };
    celery: {
      status: string;
      active_tasks: number;
    };
  };
  resources: {
    cpu_usage: string;
    memory_usage: string;
    disk_usage: string;
    network_io: string;
  };
  alerts: unknown[];
  overall_status: string;
  checked_at: string;
}

export const dashboardApi = {
  /** Fetch overall system health metrics */
  getSystemHealth: async () => {
    const { data } = await axiosInstance.get<SystemHealthResponse>(
      "/dashboard/system-health",
    );
    return data;
  },
};
