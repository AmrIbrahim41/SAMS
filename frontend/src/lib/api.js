import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "";

export const api = axios.create({ baseURL: BASE + "/api" });

// أضف التوكن تلقائيًا لو موجود
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// تجديد التوكن تلقائيًا عند انتهائه (401) ثم إعادة الطلب
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response && error.response.status;
    if (status === 401 && original && !original._retry) {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return Promise.reject(error);
      original._retry = true;
      try {
        // استخدم axios خام حتى لا يدخل هذا الطلب في نفس الـ interceptor
        refreshing = refreshing || axios.post(BASE + "/api/auth/refresh/", { refresh });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        // الـ refresh نفسه فشل — امسح الجلسة
        logout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export async function login(username, password) {
  const { data } = await api.post("/auth/login/", { username, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access");
}
