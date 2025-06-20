import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const AuthForm = () => {
	const [mode, setMode] = useState('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const { setAuth } = useAuth();

	const toggleMode = () => {
		setError('');
		setMessage('');
		setMode((prev) => (prev === 'login' ? 'register' : 'login'));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		try {
			if (mode === 'login') {
				// Use form data for OAuth2PasswordRequestForm
				const params = new URLSearchParams();
				params.append('username', email);
				params.append('password', password);

				const response = await apiClient.post('/auth/token', params, {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				});

				// Optionally, fetch user info after login
				// When a user logs in, you get a JWT (access_token) from the backend.
				const userResp = await apiClient.get(`/auth/users/${parseJwt(response.data.access_token).sub}`);
				setAuth({
					user: userResp.data,
					token: response.data.access_token,
				});
			} else {
				await apiClient.post('/auth/register', { email, password });
				setMessage('Registration successful! Please log in.');
				setMode('login');
				setEmail('');
				setPassword('');
			}
		} catch (err) {
			console.error('Auth error:', err);
			setError(err.response?.data?.detail || 'Something went wrong');
		}
	};

	// Helper to decode JWT payload
	function parseJwt(token) {
		try {
			return JSON.parse(atob(token.split('.')[1]));
		} catch (e) {
			return {};
		}
	}

	return (
		<div className="flex items-center justify-center h-screen bg-gray-100">
			<div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-center mb-6">
					{mode === 'login' ? 'Login' : 'Register'}
				</h2>
				
				{error && <p className="text-red-500 mb-4">{error}</p>}
				{message && <p className="text-green-500 mb-4">{message}</p>}
				
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="email" className="block mb-1 font-medium">Email</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					<div>
						<label htmlFor="password" className="block mb-1 font-medium">Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					<button 
						type="submit"
						className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
					>
						{mode === 'login' ? 'Login' : 'Register'}
					</button>
				</form>
				
				<div className="mt-4 text-center">
					<button
						onClick={toggleMode}
						className="text-blue-500 hover:underline"
					>
						{mode === 'login'
							? "Don't have an account? Register"
							: 'Already have an account? Login'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AuthForm;
