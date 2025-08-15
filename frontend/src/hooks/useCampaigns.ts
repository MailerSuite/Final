import { useState, useEffect, useCallback } from 'react';
import { campaignsApi } from '@/http/api';
import { useSessionStore } from '@/store/session';
import type { Campaign } from '@/types';
import { toast } from 'sonner';

interface UseCampaignsReturn {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
  startCampaign: (id: string) => Promise<boolean>;
  pauseCampaign: (id: string) => Promise<boolean>;
  stopCampaign: (id: string) => Promise<boolean>;
}

export const useCampaigns = (): UseCampaignsReturn => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSessionStore();

  const fetchCampaigns = useCallback(async () => {
    if (!session?.id) {
      setError("No session selected");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await campaignsApi.list(session.id);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch campaigns";
      setError(errorMessage);
      toast.error(errorMessage);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id]);

  const createCampaign = useCallback(async (data: Partial<Campaign>): Promise<Campaign | null> => {
    if (!session?.id) {
      toast.error("No session selected");
      return null;
    }

    try {
      const { data: newCampaign } = await campaignsApi.create(session.id, data);
      setCampaigns(prev => [...prev, newCampaign]);
      toast.success("Campaign created successfully");
      return newCampaign;
    } catch (err) {
      console.error("Failed to create campaign:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create campaign";
      toast.error(errorMessage);
      return null;
    }
  }, [session?.id]);

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.id) {
      toast.error("No session selected");
      return false;
    }

    try {
      await campaignsApi.remove(session.id, id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campaign deleted successfully");
      return true;
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete campaign";
      toast.error(errorMessage);
      return false;
    }
  }, [session?.id]);

  const startCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.id) {
      toast.error("No session selected");
      return false;
    }

    try {
      await campaignsApi.start(session.id, id);
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'running' } : c
      ));
      toast.success("Campaign started successfully");
      return true;
    } catch (err) {
      console.error("Failed to start campaign:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start campaign";
      toast.error(errorMessage);
      return false;
    }
  }, [session?.id]);

  const pauseCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.id) {
      toast.error("No session selected");
      return false;
    }

    try {
      await campaignsApi.pause(session.id, id);
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'paused' } : c
      ));
      toast.success("Campaign paused successfully");
      return true;
    } catch (err) {
      console.error("Failed to pause campaign:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to pause campaign";
      toast.error(errorMessage);
      return false;
    }
  }, [session?.id]);

  const stopCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.id) {
      toast.error("No session selected");
      return false;
    }

    try {
      await campaignsApi.stop(session.id, id);
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'stopped' } : c
      ));
      toast.success("Campaign stopped successfully");
      return true;
    } catch (err) {
      console.error("Failed to stop campaign:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to stop campaign";
      toast.error(errorMessage);
      return false;
    }
  }, [session?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    isLoading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    stopCampaign,
  };
};

export default useCampaigns; 