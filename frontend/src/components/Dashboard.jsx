import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import CreateGroupModal from './CreateGroupModal';
import Spinner from './Spinner';

const Dashboard = () => {
	const { auth } = useAuth();
	const user = auth?.user;
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [groupsLoading, setGroupsLoading] = useState(true);
	const [error, setError] = useState('');
	const [showCreateForm, setShowCreateForm] = useState(false);

	if (!auth || !auth.user) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4'>
				<div className='text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full'>
					<div className='w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4'>
						<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>Access Required</h2>
					<p className='text-gray-600'>Please log in to view your dashboard</p>
				</div>
			</div>
		);
	}

	useEffect(() => {
		if (user) {
			fetchUserGroups();
		}
	}, [user]);

	const fetchUserGroups = async () => {
		setGroupsLoading(true);
		try {
			const response = await apiClient.get('/api/groups');
			setGroups(response.data);
		} catch (err) {
			console.error('Error fetching groups:', err);
			setError('Failed to load groups');
		} finally {
			setGroupsLoading(false);
		}
	};

	const handleGroupCreated = () => {
		fetchUserGroups();
	};

	if (!user || groupsLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4">
				<div className="text-center">
					<Spinner size={64} />
					<div className="mt-6 text-lg font-medium text-gray-700">
						{!user ? 'Loading user data...' : 'Loading dashboard...'}
					</div>
					<div className="mt-2 text-sm text-gray-500">Please wait a moment</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50'>
			{/* Header Section */}
			<div className='bg-white shadow-sm border-b border-gray-100'>
				<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
						<div>
							<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
								Welcome back, {user.name}! 👋
							</h1>
							<p className='text-gray-600 mt-2 text-sm sm:text-base'>
								Manage your expense groups and track shared expenses effortlessly.
							</p>
						</div>
						<div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
							<button
								onClick={() => setShowCreateForm(true)}
								className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base'
							>
								+ New Group
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3'>
						<svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span className="text-sm sm:text-base">{error}</span>
					</div>
				)}

				{/* Main Content Grid */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
					{/* Quick Actions Card */}
					<div className='lg:col-span-1'>
						<div className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100'>
							<div className='flex items-center gap-3 mb-6'>
								<div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
									<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<h2 className='text-xl font-bold text-gray-800'>Quick Actions</h2>
							</div>
							<div className='space-y-3'>
								<button
									onClick={() => setShowCreateForm(true)}
									className='w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2'
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create New Group
								</button>
								<button
									onClick={() => navigate('/expenses')}
									className='w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2'
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
									View Expenses
								</button>
							</div>
						</div>
					</div>

					{/* Your Groups Card */}
					<div className='lg:col-span-2'>
						<div className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100'>
							<div className='flex items-center justify-between mb-6'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
										<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
									<h2 className='text-xl font-bold text-gray-800'>Your Groups</h2>
								</div>
								{groups.length > 0 && (
									<span className='bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full'>
										{groups.length} group{groups.length !== 1 ? 's' : ''}
									</span>
								)}
							</div>

							{groups.length === 0 ? (
								<div className='text-center py-12'>
									<div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
										<svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
									<h3 className='text-lg font-medium text-gray-800 mb-2'>No groups yet</h3>
									<p className='text-gray-500 mb-6 max-w-sm mx-auto'>
										Get started by creating your first expense group to share costs with friends and family.
									</p>
									<button
										onClick={() => setShowCreateForm(true)}
										className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
									>
										Create Your First Group
									</button>
								</div>
							) : (
								<div>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
										{groups.slice(0, 4).map((group) => (
											<div
												key={group.id}
												className='border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-indigo-300 cursor-pointer transition-all duration-200 group'
												onClick={() => navigate(`/groups/${group.id}`)}
											>
												<div className='flex items-start justify-between'>
													<div className='flex-1'>
														<h3 className='font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-200 mb-1'>
															{group.name}
														</h3>
														<p className='text-sm text-gray-500'>
															Created: {new Date(group.created_at).toLocaleDateString()}
														</p>
													</div>
													<svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
													</svg>
												</div>
											</div>
										))}
									</div>
									{groups.length > 4 && (
										<button
											onClick={() => navigate('/groups')}
											className='w-full text-indigo-600 hover:text-indigo-800 font-medium text-sm py-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200'
										>
											View all {groups.length} groups →
										</button>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Create Group Modal */}
			<CreateGroupModal
				isOpen={showCreateForm}
				onClose={() => setShowCreateForm(false)}
				onSuccess={handleGroupCreated}
				userId={user.id}
			/>
		</div>
	);
};

export default Dashboard;