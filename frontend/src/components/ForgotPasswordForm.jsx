import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faSpinner, faArrowLeft, faCheck, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const ForgotPasswordForm = () => {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const navigate = useNavigate();

	// Apply background to body when component mounts
	useEffect(() => {
		document.body.style.background = 'linear-gradient(to bottom right, #eff6ff, #eef2ff, #faf5ff)';
		document.body.style.minHeight = '100vh';
		
		return () => {
			document.body.style.background = '';
			document.body.style.minHeight = '';
		};
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await apiClient.post('/auth/forgot-password', { email });
			setIsSubmitted(true);
		} catch (err) {
            console.log(err);
			setIsSubmitted(true);
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackToLogin = () => {
		navigate('/login');
	};

	if (isSubmitted) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				{/* Background decoration */}
				<div className="fixed inset-0 overflow-hidden pointer-events-none">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-green-400/20 rounded-full blur-3xl"></div>
				</div>

				<div className="w-full max-w-md relative z-10">
					<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-10">
						{/* Success Icon */}
						<div className="text-center mb-6 sm:mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
								<FontAwesomeIcon icon={faCheck} className="text-white text-2xl sm:text-3xl" />
							</div>
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
								Check Your Email
							</h1>
							<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
								If an account with <strong>{email}</strong> exists, we've sent a password reset link.
							</p>
						</div>

						{/* Instructions */}
						<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
							<div className="flex items-start gap-3">
								<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<FontAwesomeIcon icon={faEnvelope} className="text-green-600 text-sm" />
								</div>
								<div className="text-sm text-green-800">
									<p className="font-medium mb-1">What's next?</p>
									<ul className="space-y-1 text-xs sm:text-sm">
										<li>• Check your email inbox (and spam folder)</li>
										<li>• Click the reset link in the email</li>
										<li>• Create a new password</li>
										<li>• The link expires in 1 hour</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Additional Security Note */}
						<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
							<div className="flex items-start gap-3">
								<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<FontAwesomeIcon icon={faShieldAlt} className="text-blue-600 text-sm" />
								</div>
								<div className="text-sm text-blue-800">
									<p className="font-medium mb-1">Security Note:</p>
									<p className="text-xs">For your security, we don't reveal whether an email address is registered. If you don't receive an email, the address may not be associated with an account.</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							<button
								onClick={handleBackToLogin}
								className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
							>
								Back to Login
							</button>
							<button
								onClick={() => {
									setIsSubmitted(false);
									setEmail('');
								}}
								className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-xl hover:bg-blue-50 transition-all duration-200 text-sm sm:text-base"
							>
								Try another email
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
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			{/* Background decoration */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Main Card */}
				<div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-10">
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
							<FontAwesomeIcon icon={faEnvelope} className="text-white text-xl sm:text-2xl" />
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							Forgot Password?
						</h1>
						<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
							Enter your email address and we'll send you a link to reset your password.
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

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isLoading || !email.trim()}
							className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg text-sm sm:text-base"
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
									Sending Reset Link...
								</div>
							) : (
								'Send Reset Link'
							)}
						</button>
					</form>

					{/* Back to Login */}
					<div className="mt-6 sm:mt-8 text-center">
						<button
							onClick={handleBackToLogin}
							disabled={isLoading}
							className="font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2 mx-auto"
						>
							<FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
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

export default ForgotPasswordForm; 