import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faUser, 
	faEnvelope, 
	faEdit, 
	faSave, 
	faTimes, 
	faEye,
	faEyeSlash,
	faLock,
	faCheck
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Spinner from './Spinner';

const Profile = () => {
	const { auth, setAuth } = useAuth();
	const [name, setName] = useState(auth.user.name);
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);


	// Password change states
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [newPasswordTouched, setNewPasswordTouched] = useState(false);

	useEffect(() => {
		if (auth?.user) {
			setName(auth.user.name || '');
		}
	}, [auth]);

	const handleLogout = () => {
		setAuth(null);
		navigate('/login');
		
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
	const passwordsMatch = newPassword === confirmPassword;

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Name cannot be empty")
			return;
		}

		setLoading(true);
		
		try {
			await apiClient.put('/auth/users/me/name', { name: name.trim() });
			setAuth({ ...auth, user: { ...auth.user, name: name.trim() } });
			setEditing(false);
			toast.success('Name updated successfully!');
		} catch (err) {
			toast.error('Failed to update name. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setEditing(false);
		setName(auth.user.name);
		
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSave();
		} else if (e.key === 'Escape') {
			handleCancel();
		}
	};

	const handleChangePassword = async (e) => {
		e.preventDefault();
		
		if (!currentPassword || !newPassword || !confirmPassword) {
			toast.error('All fields are required');
			return;
		}

		if (!allPasswordChecksValid) {
			toast.error('New password does not meet requirements');
			return;
		}

		if (!passwordsMatch) {
			toast.error('New passwords do not match');
			return;
		}

		setIsChangingPassword(true);
		try {
			// First, verify current password by attempting to login
			const params = new URLSearchParams();
			params.append('username', auth.user.email);
			params.append('password', currentPassword);
			
			await apiClient.post('/auth/token', params, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			});

			// If login successful, update password (you'll need to add this endpoint to your backend)
			await apiClient.put('/auth/users/me/password', {
				new_password: newPassword
			});

			// Reset form
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setShowChangePassword(false);
			setNewPasswordTouched(false);
			
			toast.success('Password changed successfully');
		} catch (err) {
			if (err.response?.status === 401) {
				toast.error('Current password is incorrect');
			} else {
				toast.error('Failed to change password');
				console.error('Error changing password:', err);
			}
		} finally {
			setIsChangingPassword(false);
		}
	};

	const resetPasswordForm = () => {
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setShowCurrentPassword(false);
		setShowNewPassword(false);
		setShowConfirmPassword(false);
		setNewPasswordTouched(false);
		setShowChangePassword(false);
	};

	// Get user initials for avatar
	const getInitials = (name) => {
		return name
			.split(' ')
			.map(word => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4">
				<div className="text-center">
					<Spinner size={64} />
					<div className="mt-6 text-lg font-medium text-gray-700">
						Loading profile...
					</div>
					<div className="mt-2 text-sm text-gray-500">Please wait a moment</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-4 sm:py-8 lg:py-12">
			<div className="max-w-4xl mx-auto">
				{/* Main Profile Card */}
				<div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
					{/* Profile Header */}
					<div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-8 sm:px-8 sm:py-12 relative overflow-hidden">
						{/* Background Pattern */}
						<div className="absolute inset-0 opacity-10">
							<div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
							<div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
							<div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12"></div>
						</div>
						
						<div className="text-center relative z-10">
							{/* Avatar */}
							<div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-md rounded-3xl border-2 border-white/30 mb-6 shadow-2xl">
								<span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
									{getInitials(auth.user.name)}
								</span>
							</div>
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
								{auth.user.name}
							</h2>
							<div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
								<FontAwesomeIcon icon={faEnvelope} className="text-blue-100 mr-2 text-sm" />
								<p className="text-blue-100 text-sm sm:text-base font-medium">
									{auth.user.email}
								</p>
							</div>
						</div>
					</div>
	
					{/* Profile Form */}
					<div className="p-6 sm:p-8 lg:p-10">
						<div className="space-y-8 lg:space-y-10">
							{/* Email Field */}
							<div className="space-y-4">
								<label className="flex items-center text-sm font-semibold text-gray-800">
									<div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
										<FontAwesomeIcon icon={faEnvelope} className="text-gray-600 text-sm" />
									</div>
									Email Address
								</label>
								<div className="relative">
									<input
										type="email"
										value={auth.user.email}
										disabled
										className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl text-gray-700 cursor-not-allowed focus:outline-none text-sm sm:text-base transition-all duration-200"
									/>
									<div className="absolute right-4 top-1/2 transform -translate-y-1/2">
										<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
											<FontAwesomeIcon icon={faCheck} className="mr-1 text-xs" />
											Verified
										</span>
									</div>
								</div>
								<p className="text-xs text-gray-500 flex items-center ml-1">
									<FontAwesomeIcon icon={faLock} className="mr-2 text-xs" />
									Email cannot be changed for security reasons
								</p>
							</div>
	
							{/* Name Field */}
							<div className="space-y-4">
								<label className="flex items-center text-sm font-semibold text-gray-800">
									<div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
										<FontAwesomeIcon icon={faUser} className="text-blue-600 text-sm" />
									</div>
									Display Name
								</label>
								
								{editing ? (
									<div className="space-y-4">
										<div className="relative">
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												onKeyDown={handleKeyPress}
												className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm sm:text-base hover:border-gray-300"
												placeholder="Enter your display name"
												autoFocus
											/>
										</div>
										
										{/* Action Buttons */}
										<div className="flex flex-col sm:flex-row gap-3">
											<button
												onClick={handleSave}
												disabled={loading || !name.trim()}
												className="flex-1 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
											>
												<FontAwesomeIcon 
													icon={faSave} 
													className={`mr-2 ${loading ? 'animate-spin' : ''}`} 
												/>
												{loading ? 'Saving...' : 'Save Changes'}
											</button>
											<button
												onClick={handleCancel}
												disabled={loading}
												className="flex-1 flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-semibold text-sm sm:text-base border border-gray-300"
											>
												<FontAwesomeIcon icon={faTimes} className="mr-2" />
												Cancel
											</button>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
										<span className="text-gray-900 font-semibold flex-1 text-sm sm:text-base">
											{auth.user.name}
										</span>
										<button
											onClick={() => setEditing(true)}
											className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 font-semibold text-sm border border-transparent hover:border-blue-200"
										>
											<FontAwesomeIcon icon={faEdit} className="mr-2" />
											Edit
										</button>
									</div>
								)}
							</div>
	
							{/* Change Password Section */}
							<div className="pt-6 border-t border-gray-200">
								<div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-100">
									<div className="flex items-center gap-3 mb-4">
										<div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
											<FontAwesomeIcon icon={faLock} className="text-white text-sm" />
										</div>
										<div>
											<h3 className="text-lg font-bold text-gray-800">Password Security</h3>
											<p className="text-gray-600 text-sm">Keep your account secure</p>
										</div>
									</div>
	
									{!showChangePassword ? (
										<button
											onClick={() => setShowChangePassword(true)}
											className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
										>
											<FontAwesomeIcon icon={faLock} className="text-xs" />
											Change Password
										</button>
									) : (
										<form onSubmit={handleChangePassword} className="space-y-4">
											{/* Current Password */}
											<div>
												<label className="block text-sm font-semibold text-gray-800 mb-2">
													Current Password
												</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
														<FontAwesomeIcon icon={faLock} className="text-gray-400" />
													</div>
													<input
														type={showCurrentPassword ? 'text' : 'password'}
														value={currentPassword}
														onChange={(e) => setCurrentPassword(e.target.value)}
														className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm hover:border-gray-300"
														placeholder="Enter current password"
														required
														disabled={isChangingPassword}
														autoComplete="current-password"
													/>
													<button
														type="button"
														onClick={() => setShowCurrentPassword(!showCurrentPassword)}
														className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
													>
														<FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
													</button>
												</div>
											</div>
	
											{/* New Password */}
											<div>
												<label className="block text-sm font-semibold text-gray-800 mb-2">
													New Password
												</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
														<FontAwesomeIcon icon={faLock} className="text-gray-400" />
													</div>
													<input
														type={showNewPassword ? 'text' : 'password'}
														value={newPassword}
														onChange={(e) => {
															setNewPassword(e.target.value);
															if (!newPasswordTouched && e.target.value.length > 0) {
																setNewPasswordTouched(true);
															}
														}}
														className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm hover:border-gray-300"
														placeholder="Enter new password"
														required
														disabled={isChangingPassword}
														autoComplete="new-password"
													/>
													<button
														type="button"
														onClick={() => setShowNewPassword(!showNewPassword)}
														className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
													>
														<FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
													</button>
												</div>
	
												{/* Password Requirements - Compact */}
												{newPasswordTouched && (
													<div className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
														<div className="grid grid-cols-2 gap-2">
															{passwordChecks.map((check, index) => (
																<div key={index} className="flex items-center space-x-2">
																	<div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
																		check.isValid ? 'bg-green-500' : 'bg-red-400'
																	}`}>
																		<FontAwesomeIcon 
																			icon={check.isValid ? faCheck : faTimes} 
																			className="text-white text-xs"
																		/>
																	</div>
																	<span className={`text-xs font-medium ${
																		check.isValid ? 'text-green-700' : 'text-red-600'
																	}`}>
																		{check.label}
																	</span>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
	
											{/* Confirm Password */}
											<div>
												<label className="block text-sm font-semibold text-gray-800 mb-2">
													Confirm New Password
												</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
														<FontAwesomeIcon icon={faLock} className="text-gray-400" />
													</div>
													<input
														type={showConfirmPassword ? 'text' : 'password'}
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm hover:border-gray-300"
														placeholder="Confirm new password"
														required
														disabled={isChangingPassword}
														autoComplete="new-password"
													/>
													<button
														type="button"
														onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
													>
														<FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
													</button>
												</div>
												{confirmPassword && !passwordsMatch && (
													<div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
														<p className="text-red-700 text-xs font-medium flex items-center">
															<FontAwesomeIcon icon={faTimes} className="mr-1 text-red-500" />
															Passwords do not match
														</p>
													</div>
												)}
											</div>
	
											{/* Action Buttons */}
											<div className="flex flex-col sm:flex-row gap-3 pt-2">
												<button
													type="submit"
													disabled={isChangingPassword || !allPasswordChecksValid || !passwordsMatch || !currentPassword}
													className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
												>
													{isChangingPassword ? (
														<>
															<svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															Updating...
														</>
													) : (
														<>
															<FontAwesomeIcon icon={faLock} className="text-xs" />
															Update Password
														</>
													)}
												</button>
												<button
													type="button"
													onClick={resetPasswordForm}
													disabled={isChangingPassword}
													className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 text-sm"
												>
													Cancel
												</button>
											</div>
										</form>
									)}
								</div>
							</div>
	
							{/* Additional Info */}
							<div className="pt-6 border-t border-gray-200">
								<div className="text-center">
									<div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
										<FontAwesomeIcon icon={faUser} className="text-blue-600 mr-2 text-xs" />
										<p className="text-xs text-blue-700 font-medium">
											Member since {new Date().getFullYear()}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<button
					onClick={handleLogout}
					className="w-full mt-8 bg-red-500 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Logout
				</button>
			</div>
		</div>
	);
};

export default Profile;