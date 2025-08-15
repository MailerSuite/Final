import axios from '@/http/axios';

export interface NewsletterSubscriptionRequest {
  email: string;
  name?: string;
  source?: string;
  marketing_consent?: boolean;
}

export interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
  phone?: string;
}

export interface LandingResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface LandingStats {
  total_subscribers: number;
  total_contacts: number;
  conversion_rate: number;
  last_updated: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
  category?: string;
}

export interface Testimonial {
  name: string;
  company: string;
  text: string;
  rating: number;
  avatar_url?: string;
}

export interface LandingFeatures {
  features: Feature[];
}

export interface LandingTestimonials {
  testimonials: Testimonial[];
}

export const subscribeToNewsletter = async (request: NewsletterSubscriptionRequest): Promise<LandingResponse> => {
  const response = await axios.post('/landing/newsletter', request);
  return response.data;
};

export const submitContactForm = async (request: ContactFormRequest): Promise<LandingResponse> => {
  const response = await axios.post('/landing/contact', request);
  return response.data;
};

export const getLandingStats = async (): Promise<LandingStats> => {
  const response = await axios.get('/landing/stats');
  return response.data;
};

export const getLandingFeatures = async (): Promise<LandingFeatures> => {
  const response = await axios.get('/landing/features');
  return response.data;
};

export const getLandingTestimonials = async (): Promise<LandingTestimonials> => {
  const response = await axios.get('/landing/testimonials');
  return response.data;
};

export const getLandingPlans = async (): Promise<unknown[]> => {
  const response = await axios.get('/landing/plans');
  return response.data;
}; 