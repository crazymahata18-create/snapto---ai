/**
 * SnapTo AI — Auth Module
 * Handles login, session management, and auth state
 */

const Auth = (() => {
  const TOKEN_KEY = 'snapto_token';
  const USER_KEY = 'snapto_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
  function isLoggedIn() { return !!getToken(); }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function login(username, password) {
    const data = await API.login(username, password);
    if (data.success) {
      setSession(data.token, data.user);
    }
    return data;
  }

  async function register(username, password, name, email) {
    const data = await API.register(username, password, name, email);
    if (data.success) {
      setSession(data.token, data.user);
    }
    return data;
  }

  function logout() {
    clearSession();
    window.location.href = '/login.html';
  }

  // Check auth and redirect if needed
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  return { getToken, getUser, isLoggedIn, login, register, logout, requireAuth, setSession };
})();
