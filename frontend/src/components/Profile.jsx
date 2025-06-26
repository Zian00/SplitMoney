import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faUser, 
	faEnvelope, 
	faEdit, 
	faSave, 
	faTimes, 
	faCheckCircle,
	faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
	const { auth, setAuth } = useAuth();
	const [name, setName] = useState(auth.user.name);
	const [editing, setEditing] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSave = async () => {
		if (!name.trim()) {
			setError('Name cannot be empty');
			return;
		}

		setError('');
		setMessage('');
		setLoading(true);
		
		try {
			await apiClient.put('/auth/users/me/name', { name: name.trim() });
			setAuth({ ...auth, user: { ...auth.user, name: name.trim() } });
			setEditing(false);
			setMessage('Name updated successfully!');
			
			// Clear success message after 3 seconds
			setTimeout(() => setMessage(''), 3000);
		} catch (err) {
			setError('Failed to update name. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setEditing(false);
		setName(auth.user.name);
		setError('');
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSave();
		} else if (e.key === 'Escape') {
			handleCancel();
		}
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4 sm:py-12">
			<div className="max-w-4xl mx-auto">
				{/* Header Section */}
				<div className="text-center mb-8 sm:mb-12">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
						Profile Settings
					</h1>
					<p className="text-gray-600 text-sm sm:text-base">
						Manage your account information and preferences
					</p>
				</div>

				{/* Alert Messages */}
				{error && (
					<div className="mb-6 mx-auto max-w-2xl">
						<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
							<div className="flex items-center">
								<FontAwesomeIcon 
									icon={faExclamationTriangle} 
									className="text-red-400 mr-3 flex-shrink-0" 
								/>
								<p className="text-red-700 text-sm sm:text-base">{error}</p>
							</div>
						</div>
					</div>
				)}

				{message && (
					<div className="mb-6 mx-auto max-w-2xl">
						<div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
							<div className="flex items-center">
								<FontAwesomeIcon 
									icon={faCheckCircle} 
									className="text-green-400 mr-3 flex-shrink-0" 
								/>
								<p className="text-green-700 text-sm sm:text-base">{message}</p>
							</div>
						</div>
					</div>
				)}

				{/* Main Profile Card */}
				<div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
					{/* Profile Header */}
					<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 sm:px-8 sm:py-12">
						<div className="text-center">
							{/* Avatar */}
							<div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30 mb-4">
								<span className="text-2xl sm:text-3xl font-bold text-white">
									{getInitials(auth.user.name)}
								</span>
							</div>
							<h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
								{auth.user.name}
							</h2>
							<p className="text-blue-100 text-sm sm:text-base">
								{auth.user.email}
							</p>
						</div>
					</div>

					{/* Profile Form */}
					<div className="p-6 sm:p-8">
						<div className="space-y-6">
							{/* Email Field */}
							<div>
								<label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
									<FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-500" />
									Email Address
								</label>
								<div className="relative">
									<input
										type="email"
										value={auth.user.email}
										disabled
										className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed focus:outline-none"
									/>
									<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
										<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
											Verified
										</span>
									</div>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Email cannot be changed for security reasons
								</p>
							</div>

							{/* Name Field */}
							<div>
								<label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
									<FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
									Display Name
								</label>
								
								{editing ? (
									<div className="space-y-3">
										<div className="relative">
											<input
												type="text"
												value={name}
												onChange={(e) => setName(e.target.value)}
												onKeyDown={handleKeyPress}
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
												placeholder="Enter your name"
												autoFocus
											/>
										</div>
										
										{/* Action Buttons */}
										<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
											<button
												onClick={handleSave}
												disabled={loading || !name.trim()}
												className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
												className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-medium"
											>
												<FontAwesomeIcon icon={faTimes} className="mr-2" />
												Cancel
											</button>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
										<span className="text-gray-900 font-medium flex-1">
											{auth.user.name}
										</span>
										<button
											onClick={() => setEditing(true)}
											className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium text-sm"
										>
											<FontAwesomeIcon icon={faEdit} className="mr-1" />
											Edit
										</button>
									</div>
								)}
							</div>
						</div>

						{/* Additional Info */}
						<div className="mt-8 pt-6 border-t border-gray-200">
							<div className="text-center">
								<p className="text-xs text-gray-500">
									Account created • Member since {new Date().getFullYear()}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tips Section */}
				<div className="mt-8 max-w-2xl mx-auto">
					<div className="bg-blue-50 rounded-xl p-4 sm:p-6">
						<h3 className="font-semibold text-blue-900 mb-2 flex items-center">
							<FontAwesomeIcon icon={faUser} className="mr-2" />
							Profile Tips
						</h3>
						<ul className="text-sm text-blue-700 space-y-1">
							<li>• Your display name is visible to other group members</li>
							<li>• Keep your name updated for easy identification</li>
							<li>• Email changes require account verification</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;