import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fv_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

// Auth API
export const authApi = {
  register: (data: {
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () => api.get('/auth/me'),
};

// Projects API
export const projectsApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/projects', { params }),

  getOne: (id: string) => api.get(`/projects/${id}`),

  create: (data: { name: string; [key: string]: any }) =>
    api.post('/projects', data),

  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Company API
export const companyApi = {
  get: () => api.get('/company'),
  update: (data: any) => api.patch('/company', data),
};

// Buildings API
export const buildingsApi = {
  getAll: (projectId: string) => api.get(`/projects/${projectId}/buildings`),
  getOne: (id: string) => api.get(`/projects/_/buildings/${id}`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/buildings`, data),
  update: (projectId: string, id: string, data: any) => api.patch(`/projects/${projectId}/buildings/${id}`, data),
  delete: (projectId: string, id: string) => api.delete(`/projects/${projectId}/buildings/${id}`),
};

// Floors API
export const floorsApi = {
  getAll: (buildingId: string) => api.get(`/buildings/${buildingId}/floors`),
  create: (buildingId: string, data: any) => api.post(`/buildings/${buildingId}/floors`, data),
  update: (buildingId: string, id: string, data: any) => api.patch(`/buildings/${buildingId}/floors/${id}`, data),
  delete: (buildingId: string, id: string) => api.delete(`/buildings/${buildingId}/floors/${id}`),
};

// Units API
export const unitsApi = {
  getAll: (floorId: string) => api.get(`/floors/${floorId}/units`),
  getOne: (floorId: string, id: string) => api.get(`/floors/${floorId}/units/${id}`),
  create: (floorId: string, data: any) => api.post(`/floors/${floorId}/units`, data),
  bulkCreate: (floorId: string, data: any) => api.post(`/floors/${floorId}/units/bulk`, data),
  update: (floorId: string, id: string, data: any) => api.patch(`/floors/${floorId}/units/${id}`, data),
  delete: (floorId: string, id: string) => api.delete(`/floors/${floorId}/units/${id}`),
  duplicate: (floorId: string, id: string) => api.post(`/floors/${floorId}/units/${id}/duplicate`),
};

// Rooms API
export const roomsApi = {
  getAll: (unitId: string) => api.get(`/units/${unitId}/rooms`),
  create: (unitId: string, data: any) => api.post(`/units/${unitId}/rooms`, data),
  update: (unitId: string, id: string, data: any) => api.patch(`/units/${unitId}/rooms/${id}`, data),
  delete: (unitId: string, id: string) => api.delete(`/units/${unitId}/rooms/${id}`),
};

// Blueprints API
export const blueprintsApi = {
  getAll: (projectId: string) => api.get(`/projects/${projectId}/blueprints`),
  getOne: (projectId: string, id: string) => api.get(`/projects/${projectId}/blueprints/${id}`),
  upload: (projectId: string, file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/projects/${projectId}/blueprints/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  delete: (projectId: string, id: string) => api.delete(`/projects/${projectId}/blueprints/${id}`),
  getSheetImage: (projectId: string, blueprintId: string, sheetId: string, type: 'image' | 'thumbnail' = 'image') =>
    api.get(`/projects/${projectId}/blueprints/${blueprintId}/sheets/${sheetId}/image`, { params: { type } }),
};

// Sheets API
export const sheetsApi = {
  getByBlueprint: (blueprintId: string) => api.get(`/sheets/blueprint/${blueprintId}`),
  getOne: (id: string) => api.get(`/sheets/${id}`),
  update: (id: string, data: any) => api.patch(`/sheets/${id}`, data),
  updateScale: (id: string, data: { scaleText: string; scaleFactor: number }) =>
    api.patch(`/sheets/${id}/scale`, data),
};

// Annotations API
export const annotationsApi = {
  getBySheet: (sheetId: string) => api.get(`/sheets/${sheetId}/annotations`),
  create: (sheetId: string, data: any) => api.post(`/sheets/${sheetId}/annotations`, data),
  update: (id: string, data: any) => api.patch(`/annotations/${id}`, data),
  delete: (id: string) => api.delete(`/annotations/${id}`),
};

// Takeoff Categories API
export const takeoffCategoriesApi = {
  getAll: () => api.get('/takeoff-categories'),
  create: (data: any) => api.post('/takeoff-categories', data),
  update: (id: string, data: any) => api.patch(`/takeoff-categories/${id}`, data),
};

// Takeoff Items API
export const takeoffItemsApi = {
  getByProject: (projectId: string, params?: Record<string, string>) =>
    api.get(`/projects/${projectId}/takeoff-items`, { params }),
  getBySheet: (sheetId: string) => api.get(`/sheets/${sheetId}/takeoff-items`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/takeoff-items`, data),
  bulkCreate: (projectId: string, data: { items: any[] }) =>
    api.post(`/projects/${projectId}/takeoff-items/bulk`, data),
  update: (id: string, data: any) => api.patch(`/takeoff-items/${id}`, data),
  delete: (id: string) => api.delete(`/takeoff-items/${id}`),
  getSummary: (projectId: string) => api.get(`/projects/${projectId}/takeoff-summary`),
};

// Cost Items API
export const costItemsApi = {
  getAll: () => api.get('/cost-items'),
  create: (data: any) => api.post('/cost-items', data),
  update: (id: string, data: any) => api.patch(`/cost-items/${id}`, data),
};

// Labor Rates API
export const laborRatesApi = {
  getAll: () => api.get('/labor-rates'),
  create: (data: any) => api.post('/labor-rates', data),
  update: (id: string, data: any) => api.patch(`/labor-rates/${id}`, data),
};

// Assemblies API
export const assembliesApi = {
  getAll: () => api.get('/assemblies'),
  getOne: (id: string) => api.get(`/assemblies/${id}`),
  create: (data: any) => api.post('/assemblies', data),
  update: (id: string, data: any) => api.patch(`/assemblies/${id}`, data),
};

// Estimates API
export const estimatesApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/estimates`),
  getOne: (id: string) => api.get(`/estimates/${id}`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/estimates`, data),
  generateFromTakeoff: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/estimates/generate`, data),
  update: (id: string, data: any) => api.patch(`/estimates/${id}`, data),
  delete: (id: string) => api.delete(`/estimates/${id}`),
  addLine: (estimateId: string, data: any) => api.post(`/estimates/${estimateId}/lines`, data),
  updateLine: (lineId: string, data: any) => api.patch(`/estimate-lines/${lineId}`, data),
  deleteLine: (lineId: string) => api.delete(`/estimate-lines/${lineId}`),
};

// Reports API
export const reportsApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/reports`),
  getOne: (id: string) => api.get(`/reports/${id}`),
  generate: (projectId: string, data: {
    type: 'TAKEOFF_SUMMARY' | 'ESTIMATE_SUMMARY' | 'PROPOSAL';
    format?: 'PDF' | 'CSV' | 'JSON';
    estimateId?: string;
    name?: string;
  }) => api.post(`/projects/${projectId}/reports/generate`, data),
  getDownloadUrl: (id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    return `${baseUrl}/reports/${id}/download`;
  },
  delete: (id: string) => api.delete(`/reports/${id}`),
};

// ============================================
// AI ENGINE
// ============================================

export const aiApi = {
  // Trigger analysis on a sheet
  triggerAnalysis: (projectId: string, sheetId: string, steps?: string[]) =>
    api.post(`/projects/${projectId}/sheets/${sheetId}/ai/analyze`, { projectId, steps }),

  // Jobs
  getJob: (jobId: string) => api.get(`/ai/jobs/${jobId}`),
  getJobsBySheet: (sheetId: string) => api.get(`/sheets/${sheetId}/ai/jobs`),
  getJobsByProject: (projectId: string) => api.get(`/projects/${projectId}/ai/jobs`),

  // Detections
  getDetectionsBySheet: (sheetId: string, status?: string) =>
    api.get(`/sheets/${sheetId}/ai/detections`, { params: { status } }),
  getDetectionsByProject: (projectId: string, status?: string) =>
    api.get(`/projects/${projectId}/ai/detections`, { params: { status } }),
  getDetectionSummary: (projectId: string) =>
    api.get(`/projects/${projectId}/ai/summary`),

  // Review
  reviewDetection: (detectionId: string, data: { status: string; reviewNotes?: string; categoryId?: string; label?: string }) =>
    api.patch(`/ai/detections/${detectionId}/review`, data),
  bulkReview: (data: { detectionIds: string[]; status: string }) =>
    api.post(`/ai/detections/bulk-review`, data),
};
