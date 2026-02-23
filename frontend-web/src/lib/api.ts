import axios from 'axios';

const getBaseURL = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    // 1. Remover espaços e pontos finais acidentais
    url = url.trim().replace(/\.+$/, '');

    // 2. Remover barra final para padronizar
    url = url.replace(/\/+$/, '');

    // 3. Se o URL não contém /api/v1, vamos adicioná-lo
    // Mas antes, removemos um /api ou /api/v solitário no fim para não duplicar
    if (!url.endsWith('/api/v1')) {
        url = url.replace(/\/api\/v$/, '');
        url = url.replace(/\/api$/, '');
        url = `${url}/api/v1`;
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
