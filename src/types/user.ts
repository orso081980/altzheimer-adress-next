export interface User {
  _id?: string;
  id?: string;
  email: string;
  password?: string; // Only for creation/update, never returned in responses
  name: string;
  role: 'admin' | 'researcher';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'researcher';
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: 'admin' | 'researcher';
  isActive?: boolean;
  password?: string; // Optional password update
}

export interface UserResponse {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UsersListResponse {
  users: UserResponse[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}