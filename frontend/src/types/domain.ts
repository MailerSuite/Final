export type DomainStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending'
  | 'valid'
  | 'junk'
  | 'dead'
  | 'alive'

export type Domain = {
  id: string;
  url: string;
  domain_type: 'website' | 'api' | 'other';
  status: DomainStatus;
  health?: DomainStatus;
  country: string
  auth_status: boolean;
  last_checked: string; // ISO 8601 string
  response_time: number; // ms
  error_message: string | null;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
};

export type AddDomainInput = {
  url: string;
  domain_type: 'website' | 'api' | 'other';
};

export type EditDomainInput = {
  url: string;
  domain_type: 'website' | 'api' | 'other';
  status: DomainStatus;
  auth_status: boolean;
  response_time: number;
  error_message: string | null;
};

