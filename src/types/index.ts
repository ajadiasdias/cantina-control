export type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
};

export type User = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  created_at: string;
  updated_at: string;
};

export type Sector = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_number: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: number;
  sector_id: number;
  type: 'opening' | 'general' | 'closing';
  title: string;
  description: string | null;
  is_required: boolean;
  requires_photo: boolean;
  estimated_time: number | null;
  order_number: number;
  days_of_week: string; // JSON array
  created_at: string;
  updated_at: string;
};

export type TaskCompletion = {
  id: number;
  task_id: number;
  user_id: number;
  completed_at: string;
  photo_url: string | null;
  notes: string | null;
};

export type Variables = {
  user: User;
};
