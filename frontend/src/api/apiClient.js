import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
	baseURL: 'http://localhost:8000',
	headers: {
		'Content-Type': 'application/json',
	},
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
			// Show a toast instead of alert
			toast.error('Session expired, please log in again.');
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
