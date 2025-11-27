import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login if user was authenticated (had a token) but got 401/403
        const hadToken = !!localStorage.getItem('token');
        if (error.response && (error.response.status === 401 || error.response.status === 403) && hadToken) {
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userId');
            // Redirect to login only if on a protected page
            const publicPaths = ['/', '/login', '/register', '/articles', '/leaderboard', '/marathons'];
            const currentPath = window.location.pathname;
            const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith('/articles/'));

            if (!isPublicPath) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
