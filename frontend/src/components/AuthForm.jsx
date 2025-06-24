import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const AuthForm = () => {
	const location = useLocation();
	const [mode, setMode] = useState(location.state?.defaultMode || 'login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const { setAuth } = useAuth();
	const navigate = useNavigate();

	const toggleMode = () => {
		setError('');
		setMessage('');
		setMode((prev) => (prev === 'login' ? 'register' : 'login'));
	};

	// Helper to decode JWT payload
	const parseJwt = (token) => {
		try {
			return JSON.parse(atob(token.split('.')[1]));
		} catch (e) {
			return {};
		}
	};

	const handleLoginFlow = async (loginEmail, loginPassword) => {
		// Step 1: Get the access token
		const params = new URLSearchParams();
		params.append('username', loginEmail);
		params.append('password', loginPassword);
		const response = await apiClient.post('/auth/token', params, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		// Step 2: Get user data with the new token
		const token = response.data.access_token;
		const userResp = await apiClient.get(`/auth/users/${parseJwt(token).sub}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		// Step 3: Set auth state
		const newAuth = { token, user: userResp.data };
		setAuth(newAuth);

		// Step 4: Check for and handle pending invitation
		const pendingToken = localStorage.getItem('pending_invite_token');
		if (pendingToken) {
			try {
				toast.info("Accepting your pending invitation...");
				const res = await apiClient.get(`/api/invites/accept/${pendingToken}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				toast.success("You've successfully joined the group!");
				localStorage.removeItem('pending_invite_token');
				navigate(`/groups/${res.data.group_id}`);
				return true; // Indicate that we handled an invite
			} catch (inviteErr) {
				console.log(inviteErr)
				toast.error(inviteErr.response?.data?.detail || "Failed to accept invitation.");
				localStorage.removeItem('pending_invite_token');
			}
		}
		return false; // No invite was handled
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		try {
			if (mode === 'login') {
				await handleLoginFlow(email, password);
			} else {
				// Register the user
				await apiClient.post('/auth/register', { email, password });
				// Automatically log them in after registration
				const inviteHandled = await handleLoginFlow(email, password);
				if (!inviteHandled) {
					toast.success("Registration successful! Logging you in.");
				}
			}
		} catch (err) {
			console.error('Auth error:', err);
			setError(err.response?.data?.detail || 'An error occurred. Please try again.');
		}
	};

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
