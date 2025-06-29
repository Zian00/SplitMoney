import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faSpinner, faCheck, faTimes, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const ResetPasswordForm = () => {
	const { token } = useParams();
	const navigate = useNavigate();
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isValidating, setIsValidating] = useState(true);
	const [isValidToken, setIsValidToken] = useState(false);
	const [passwordTouched, setPasswordTouched] = useState(false);

	// Apply background to body when component mounts
	useEffect(() => {
		document.body.style.background = 'linear-gradient(to bottom right, #eff6ff, #eef2ff, #faf5ff)';
		document.body.style.minHeight = '100vh';
		
		return () => {
			document.body.style.background = '';
			document.body.style.minHeight = '';
		};
	}, []);

	// Validate token on component mount
	useEffect(() => {
		const validateToken = async () => {
			try {
				await apiClient.get(`/auth/reset-password/${token}`);
				setIsValidToken(true);
			} catch (err) {
				setIsValidToken(false);
				toast.error('Invalid or expired reset link');
			} finally {
				setIsValidating(false);
			}
		};

		validateToken();
	}, [token]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		setIsLoading(true);

		try {
			await apiClient.post('/auth/reset-password', {
				token,
				new_password: newPassword
			});
			
			toast.success('Password reset successfully!');
			setTimeout(() => {
				navigate('/login');
			}, 2000);
		} catch (err) {
			const detail = err.response?.data?.detail;
			if (detail) {
				toast.error(detail);
			} else {
				toast.error('Failed to reset password. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Password validation checks
	const passwordChecks = [
		{
			label: "At least 8 characters",
			isValid: newPassword.length >= 8
		},
		{
			label: "One uppercase letter",
			isValid: /[A-Z]/.test(newPassword)
		},
		{
			label: "One lowercase letter",
			isValid: /[a-z]/.test(newPassword)
		},
		{
			label: "One digit",
			isValid: /\d/.test(newPassword)
		}
	];

	const allPasswordChecksValid = passwordChecks.every(check => check.isValid);
	const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

	if (isValidating) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="text-center">
					<div className="relative">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
					</div>
					<div className="text-lg font-semibold text-gray-700">Validating reset link...</div>
					<div className="text-sm text-gray-500 mt-1">Please wait</div>
				</div>
			</div>
		);
	}

	if (!isValidToken) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="w-full max-w-md">
					<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-10 text-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<FontAwesomeIcon icon={faShieldAlt} className="text-red-600 text-2xl" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
						<p className="text-gray-600 mb-6">
							This password reset link is invalid or has expired. Please request a new one.
						</p>
						<button
							onClick={() => navigate('/forgot-password')}
							className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
						>
							Request New Reset Link
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			{/* Background decoration */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-green-400/20 rounded-full blur-3xl"></div>
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Main Card */}
				<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-10">
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
							<FontAwesomeIcon icon={faLock} className="text-white text-xl sm:text-2xl" />
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							Reset Your Password
						</h1>
						<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
							Enter your new password below to complete the reset process.
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						{/* New Password Field */}
						<div className="space-y-2">
							<label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">
								New Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<FontAwesomeIcon icon={faLock} className="text-gray-600 text-sm sm:text-base" />
								</div>
								<input
									id="newPassword"
									type={showPassword ? 'text' : 'password'}
									value={newPassword}
									onChange={(e) => {
										setNewPassword(e.target.value);
										if (!passwordTouched && e.target.value.length > 0) {
											setPasswordTouched(true);
										}
									}}
									required
									disabled={isLoading}
									className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
									placeholder="Enter new password"
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

							{/* Password Requirements */}
							{passwordTouched && (
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
								</div>
							)}
						</div>

						{/* Confirm Password Field */}
						<div className="space-y-2">
							<label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
								Confirm New Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<FontAwesomeIcon icon={faLock} className="text-gray-600 text-sm sm:text-base" />
								</div>
								<input
									id="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									disabled={isLoading}
									className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
										confirmPassword.length > 0
											? passwordsMatch
												? 'border-green-300 focus:ring-green-500'
												: 'border-red-300 focus:ring-red-500'
											: 'border-gray-300 focus:ring-green-500'
									}`}
									placeholder="Confirm new password"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									disabled={isLoading}
									className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
								>
									<FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="text-sm sm:text-base" />
								</button>
							</div>
							{confirmPassword.length > 0 && (
								<div className={`flex items-center space-x-2 text-sm ${
									passwordsMatch ? 'text-green-600' : 'text-red-600'
								}`}>
									<FontAwesomeIcon icon={passwordsMatch ? faCheck : faTimes} />
									<span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
								</div>
							)}
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading || !allPasswordChecksValid || !passwordsMatch}
							className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg text-sm sm:text-base"
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
									Resetting Password...
								</div>
							) : (
								'Reset Password'
							)}
						</button>
					</form>

					{/* Back to Login */}
					<div className="mt-6 sm:mt-8 text-center">
						<button
							onClick={() => navigate('/login')}
							disabled={isLoading}
							className="font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
						>
							Back to Login
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

export default ResetPasswordForm; 