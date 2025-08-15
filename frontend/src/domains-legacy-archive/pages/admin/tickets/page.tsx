import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/page-header';
import { AdminApi } from "@/api/admin-api";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
}

const api = new AdminApi();

const AdminTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.listSupportTicketsApiV1AdminSupportTicketsGet();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const changeStatus = async (id: string, status: string) => {
    try {
      setLoading(true);
      await api.updateTicketStatusApiV1AdminSupportTicketsTicketIdStatusPut(
        parseInt(id),
        status
      );
      await loadTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Support Tickets" />
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border p-2 rounded-md"
            >
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.user_id}</div>
              </div>
              <Select
                value={t.status}
                onValueChange={(v) => changeStatus(t.id, v)}
              >
                <SelectTrigger className="w-32" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          {tickets.length === 0 && (
            <p className="text-sm text-muted-foreground">No tickets.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTickets;
