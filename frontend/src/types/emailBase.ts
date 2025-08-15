export interface EmailBase {
  id: number;
  session_id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  status: string;
  created_at: string;
}
