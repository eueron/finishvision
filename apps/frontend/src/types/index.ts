export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'ESTIMATOR' | 'VIEWER';
  companyId: string;
  companyName: string;
  subscriptionTier?: string;
}

export interface Company {
  id: string;
  name: string;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  address?: string;
  phone?: string;
  website?: string;
  defaultMarkup: number;
  defaultTaxRate: number;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'BIDDING' | 'AWARDED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  bidDate?: string;
  generalContractor?: string;
  architect?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    buildings: number;
  };
  buildings?: Building[];
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  floors: Floor[];
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  sortOrder: number;
  units: Unit[];
}

export interface Unit {
  id: string;
  floorId: string;
  name: string;
  unitType?: string;
  sortOrder: number;
  rooms: Room[];
}

export interface Room {
  id: string;
  unitId: string;
  name: string;
  roomType?: string;
  sortOrder: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
