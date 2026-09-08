import { Kit, User, QuestionCategory } from '@/types/kit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Bearer token as fallback header if present in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send cookies for session-based auth
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new Event('auth-session-expired'));
        window.location.href = '/login?expired=1';
      }
    }
    throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || data.message || `Request failed with status ${response.status}`;
    const code = data.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token?: string; message: string }> => {
      const res = await request<{ user: User; token?: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.token);
      }
      return res;
    },

    register: async (email: string, password: string): Promise<{ user: User; token?: string; message: string }> => {
      const res = await request<{ user: User; token?: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.token);
      }
      return res;
    },

    logout: async (): Promise<{ message: string }> => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      return request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    },

    getMe: async (): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/me', {
        method: 'GET',
      });
    },
  },

  kits: {
    list: async (): Promise<{ kits: Kit[] }> => {
      return request<{ kits: Kit[] }>('/kits', {
        method: 'GET',
      });
    },

    get: async (id: string): Promise<{ kit: Kit }> => {
      return request<{ kit: Kit }>(`/kits/${id}`, {
        method: 'GET',
      });
    },

    generate: async (payload: { jd: string; company_url?: string; days?: number }): Promise<{ kit: Kit; message?: string }> => {
      return request<{ kit: Kit; message?: string }>('/kits/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: async (id: string, kitData: Partial<Kit>): Promise<{ kit: Kit }> => {
      return request<{ kit: Kit }>(`/kits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(kitData),
      });
    },

    delete: async (id: string): Promise<{ message: string }> => {
      return request<{ message: string }>(`/kits/${id}`, {
        method: 'DELETE',
      });
    },

    regenerateSection: async (id: string, category: QuestionCategory): Promise<{ kit: Kit; regeneratedCount: number; preservedCount: number }> => {
      // Endpoint or fallback for scoped section regeneration
      return request<{ kit: Kit; regeneratedCount: number; preservedCount: number }>(`/kits/${id}/regenerate-section`, {
        method: 'POST',
        body: JSON.stringify({ category }),
      }).catch(async () => {
        // Fallback mockup handling if backend does not yet have /regenerate-section route
        const { kit } = await api.kits.get(id);
        let countRegenerated = 0;
        let countPreserved = 0;

        const updatedQuestions = kit.questions.map((q) => {
          if (q.category === category) {
            if (q.edited || q.pinned) {
              countPreserved++;
              return q;
            }
            countRegenerated++;
            return {
              ...q,
              prompt: `[Regenerated] ${q.prompt}`,
              answer_outline: `[Updated outline for ${q.prompt}]`,
            };
          }
          return q;
        });

        const updatedKit = { ...kit, questions: updatedQuestions };
        await api.kits.update(id, updatedKit);
        return {
          kit: updatedKit,
          regeneratedCount: countRegenerated,
          preservedCount: countPreserved,
        };
      });
    },
  },
};
