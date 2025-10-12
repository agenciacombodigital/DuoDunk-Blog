export const ADMIN_PASSWORD = 'duodunk2025'; // Troque por uma senha forte

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const auth = sessionStorage.getItem('admin_auth');
  return auth === 'true';
}

export function authenticate(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true');
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem('admin_auth');
}