import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faUser, faLock, faEnvelope, faSpinner, faCheck, faTimes, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const AuthForm = ({ mode = "login" }) => {
	const location = useLocation();
	const [modeState, setModeState] = useState(location.state?.defaultMode || mode);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [passwordTouched, setPasswordTouched] = useState(false);
	const { setAuth } = useAuth();
	const navigate = useNavigate();
	const isLogin = modeState === "login";

	// Choose colors/icons based on mode
	const bgGradient = isLogin
		? "from-blue-100 via-indigo-100 to-purple-100"
		: "from-green-100 via-lime-100 to-yellow-100";
	const cardBorder = isLogin
		? "border-blue-200 shadow-blue-100"
		: "border-green-200 shadow-green-100";
	const headerIcon = isLogin ? faUser : faUserPlus;
	const headerIconBg = isLogin
		? "bg-gradient-to-br from-blue-600 to-indigo-600"
		: "bg-gradient-to-br from-green-500 to-lime-500";
	const headerText = isLogin ? "text-blue-700" : "text-green-700";
	const buttonColor = isLogin
		? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
		: "bg-green-600 hover:bg-green-700 focus:ring-green-500";
	const toggleLinkColor = isLogin
		? "text-green-700 hover:text-green-800"
		: "text-blue-700 hover:text-blue-800";

	// Apply background to body when component mounts
	useEffect(() => {
		// Apply background styles to body
		document.body.style.background = 'linear-gradient(to bottom right, #eff6ff, #eef2ff, #faf5ff)';
		document.body.style.minHeight = '100vh';
		
		// Cleanup function to remove styles when component unmounts
		return () => {
			document.body.style.background = '';
			document.body.style.minHeight = '';
		};
	}, []);

	const toggleMode = () => {
		setPassword('');
		setPasswordTouched(false);
		setModeState((prev) => (prev === 'login' ? 'register' : 'login'));
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
		setIsLoading(true);

		try {
			if (modeState === 'login') {
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
			const status = err?.response?.status;
			const detail = err?.response?.data?.detail;
			// Only show toast if not handled by interceptor (i.e., not 401)
			if (status !== 401) {
				if (detail && detail.includes("Email already registered")) {
					toast.error("An account with this email is already registered.");
				} else if (detail) {
					toast.error(detail);
				} else {
					console.log(detail);
					toast.error("Registration failed. Please try again.");
				}
			}
			console.error('Auth error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	// Password validation checks
	const passwordChecks = [
		{
			label: "At least 8 characters",
			isValid: password.length >= 8
		},
		{
			label: "One uppercase letter",
			isValid: /[A-Z]/.test(password)
		},
		{
			label: "One lowercase letter",
			isValid: /[a-z]/.test(password)
		},
		{
			label: "One digit",
			isValid: /\d/.test(password)
		}
	];

	const allPasswordChecksValid = passwordChecks.every(check => check.isValid);

	return (
		<div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${bgGradient} transition-colors duration-500`}>
			{/* Background decoration */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Main Card */}
				<div className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border-2 ${cardBorder} p-6 sm:p-8 lg:p-10 transition-all duration-500`}>
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${headerIconBg} rounded-2xl mb-4 shadow-lg transition-all duration-500`}>
							<FontAwesomeIcon icon={headerIcon} className="text-white text-xl sm:text-2xl" />
						</div>
						<h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${headerText} transition-colors duration-500`}>
							{isLogin ? 'Welcome Back' : 'Create Account'}
						</h1>
						<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
							{isLogin 
								? 'Sign in to your account to continue' 
								: 'Join us and start managing your expenses'
							}
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						{/* Email Field */}
						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-semibold text-gray-700">
								Email Address
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<FontAwesomeIcon icon={faEnvelope} className="text-gray-600 text-sm sm:text-base" />
								</div>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={isLoading}
									className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
									placeholder="Enter your email"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div className="space-y-2">
							<label htmlFor="password" className="block text-sm font-semibold text-gray-700">
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<FontAwesomeIcon icon={faLock} className="text-gray-600 text-sm sm:text-base" />
								</div>
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (!passwordTouched && e.target.value.length > 0) {
											setPasswordTouched(true);
										}
									}}
									required
									disabled={isLoading}
									className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
									placeholder="Enter your password"
									autoComplete={modeState === 'register' ? "new-password" : "current-password"}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
									className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
								>
									<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm sm:text-base" />
								</button>
							</div>

							{/* Password Requirements - Only show in register mode */}
							{modeState === 'register' && passwordTouched && (
								<div className="mt-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
									<p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
									<div className="space-y-1.5 sm:space-y-2">
										{passwordChecks.map((check, index) => (
											<div key={index} className="flex items-center space-x-2">
												<div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
													check.isValid 
														? 'bg-green-100 text-green-600' 
														: 'bg-red-100 text-red-600'
												}`}>
													<FontAwesomeIcon 
														icon={check.isValid ? faCheck : faTimes} 
														className="text-xs sm:text-sm"
													/>
												</div>
												<span className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
													check.isValid 
														? 'text-green-700' 
														: 'text-red-700'
												}`}>
													{check.label}
												</span>
											</div>
										))}
									</div>
									{password.length > 0 && (
										<div className="mt-3 pt-3 border-t border-gray-200">
											<div className="flex items-center space-x-2">
												<div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
													allPasswordChecksValid 
														? 'bg-green-100 text-green-600' 
														: 'bg-red-100 text-red-600'
												}`}>
													<FontAwesomeIcon 
														icon={allPasswordChecksValid ? faCheck : faTimes} 
														className="text-xs sm:text-sm"
													/>
												</div>
												<span className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${
													allPasswordChecksValid 
														? 'text-green-700' 
														: 'text-red-700'
												}`}>
													{allPasswordChecksValid ? 'Password meets all requirements' : 'Password requirements not met'}
												</span>
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Forgot Password Link - Add this after the password field */}
						{modeState === 'login' && (
							<div className="text-right">
								<button
									type="button"
									onClick={() => navigate('/forgot-password')}
									className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
								>
									Forgot your password?
								</button>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading || (modeState === 'register' && passwordTouched && !allPasswordChecksValid)}
							className={`
								w-full py-3 rounded-lg font-semibold text-lg transition-colors
								${buttonColor}
								text-white
								focus:outline-none focus:ring-2 focus:ring-offset-2
							`}
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
									{isLogin ? 'Signing In...' : 'Creating Account...'}
								</div>
							) : (
								isLogin ? 'Sign In' : 'Create Account'
							)}
						</button>
					</form>

					{/* Toggle Mode */}
					<div className="mt-6 sm:mt-8 text-center">
						<p className="text-sm sm:text-base text-gray-600 mb-2">
							{isLogin ? "Don't have an account?" : 'Already have an account?'}
						</p>
						<button
							onClick={toggleMode}
							disabled={isLoading}
							className={`font-semibold underline decoration-2 underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${toggleLinkColor} transition-colors`}
						>
							{isLogin ? 'Create an account' : 'Sign in instead'}
						</button>
					</div>
				</div>

				{/* Footer */}
				<div className="text-center mt-6 sm:mt-8">
					<p className="text-xs sm:text-sm text-gray-500">
						© {new Date().getFullYear()} SplitMoney. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AuthForm;