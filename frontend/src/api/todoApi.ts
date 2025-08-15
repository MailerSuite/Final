import { httpRequest } from '../http/httpRequest';

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoListResponse {
  todos: Todo[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
}

// Auth API
export const authApi = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await httpRequest({
      method: 'POST',
              url: '/register',
      data,
    });
    return response.data;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    // FIXED: Use JSON format and correct field names for backend compatibility
    const response = await httpRequest({
      method: 'POST',
      url: '/api/v1/auth/login',
      data: {
        email: data.username, // Backend expects 'email' field
        password: data.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
};

// Todo API
export const todoApi = {
  getTodos: async (params?: {
    page?: number;
    per_page?: number;
    completed?: boolean;
    search?: string;
  }): Promise<TodoListResponse> => {
    const response = await httpRequest({
      method: 'GET',
      url: '/todos/',
      params,
    });
    return response.data;
  },

  getTodo: async (id: number): Promise<Todo> => {
    const response = await httpRequest({
      method: 'GET',
      url: `/todos/${id}`,
    });
    return response.data;
  },

  createTodo: async (data: CreateTodoData): Promise<Todo> => {
    const response = await httpRequest({
      method: 'POST',
      url: '/todos/',
      data,
    });
    return response.data;
  },

  updateTodo: async (id: number, data: UpdateTodoData): Promise<Todo> => {
    const response = await httpRequest({
      method: 'PUT',
      url: `/todos/${id}`,
      data,
    });
    return response.data;
  },

  deleteTodo: async (id: number): Promise<void> => {
    await httpRequest({
      method: 'DELETE',
      url: `/todos/${id}`,
    });
  },
}; 