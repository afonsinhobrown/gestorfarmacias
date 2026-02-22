import axios from 'axios';

const getBaseURL = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    // Normalização: Remover ponto final acidental (ex: .com.)
    url = url.replace(/\.+$/, '');

    // Garantir que termina com /api/v1 se não estiver presente
    if (!url.includes('/api/v1')) {
        url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
    }

    return url;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
});

// Interceptor para lidar com erros 401 (token expirado) ou erros de rede
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Detecção de erro de rede (Servidor Down)
        if (!error.response || error.code === 'ERR_NETWORK') {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/manutencao')) {
                window.location.href = '/manutencao';
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            // Implementar lógica de refresh token aqui futuramente
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Usar window.location para forçar reload e limpar estados
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
