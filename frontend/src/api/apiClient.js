import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

// Add a request interceptor to include JWT
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			const detail = error.response.data?.detail;
			// Token valid, but user deleted	
			if (detail === "User not found") {
				toast.error('Account does not exist. Please register or contact support.');
				//Token expired/invalid
			} else if (detail === "Invalid authentication credentials") {
				toast.error('Session expired, please log in again.');
			} else if (detail === "Incorrect email or password") {
				toast.error('Incorrect email or password.');
			} else {
				toast.error(detail || 'Authentication error. Please log in again.');
			}
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			setTimeout(() => {
				window.location.reload();
			}, 1500); // Give user time to see the toast
		}
		return Promise.reject(error);
	}
);

export default apiClient;
