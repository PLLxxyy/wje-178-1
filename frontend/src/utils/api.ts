const BASE_URL = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export function getToken(): string | null {
  return localStorage.getItem('gym_token');
}

export function setToken(token: string): void {
  localStorage.setItem('gym_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('gym_token');
}

export function getUser(): any {
  const user = localStorage.getItem('gym_user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  localStorage.setItem('gym_user', JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem('gym_user');
}

export async function api(path: string, options: ApiOptions = {}): Promise<any> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authToken = token || getToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export async function login(phone: string, password: string) {
  const data = await api('/auth/login', { method: 'POST', body: { phone, password } });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function register(phone: string, password: string, name: string) {
  const data = await api('/auth/register', { method: 'POST', body: { phone, password, name } });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export function logout() {
  removeToken();
  removeUser();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'admin';
}
