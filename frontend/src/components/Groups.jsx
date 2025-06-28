import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import CreateGroupModal from './CreateGroupModal';

const Groups = () => {
	const { auth } = useAuth();
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [groupStats, setGroupStats] = useState({});

	useEffect(() => {
		fetchGroups();
	}, []);

	const fetchGroups = async () => {
		try {
			const response = await apiClient.get('/api/groups');
			setGroups(response.data);

			// Fetch stats for each group in parallel
			const stats = {};
			await Promise.all(response.data.map(async (group) => {
				try {
					const [membersRes, expensesRes] = await Promise.all([
						apiClient.get(`/api/groups/${group.id}/members`),
						apiClient.get(`/api/groups/${group.id}/expenses`)
					]);
					stats[group.id] = {
						members: membersRes.data.members.length,
						expenses: expensesRes.data.length
					};
				} catch {
					stats[group.id] = { members: 1, expenses: 0 }; // fallback
				}
			}));
			setGroupStats(stats);
		} catch (err) {
			toast.error('Failed to load groups');
			console.error('Error fetching groups:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleGroupCreated = () => {
		fetchGroups();
	};

	// Filter groups based on search term
	const filteredGroups = groups.filter(group =>
		group.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4">
				<div className="text-center">
					<div className="relative">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 mx-auto"></div>
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
					</div>
					<div className="mt-6 text-lg font-medium text-gray-700">Loading groups...</div>
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
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
						<div>
							<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
								Your Groups
							</h1>
							<p className='text-gray-600 mt-2 text-sm sm:text-base'>
								Manage and organize your expense sharing groups
							</p>
						</div>
						<button
							onClick={() => setShowCreateForm(true)}
							className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base'
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Create Group
						</button>
					</div>

					{/* Search and Stats Bar */}
					<div className='flex flex-col sm:flex-row gap-4 items-center'>
						<div className='flex-1 w-full sm:max-w-md'>
							<div className='relative'>
								<svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<input
									type="text"
									placeholder="Search groups..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
								/>
							</div>
						</div>
						<div className='flex items-center gap-4 text-sm text-gray-600'>
							<div className='flex items-center gap-2'>
								<div className='w-2 h-2 bg-indigo-500 rounded-full'></div>
								<span>{groups.length} Total Groups</span>
							</div>
							{searchTerm && (
								<div className='flex items-center gap-2'>
									<div className='w-2 h-2 bg-green-500 rounded-full'></div>
									<span>{filteredGroups.length} Found</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{/* Groups Grid */}
				{filteredGroups.length === 0 ? (
					<div className='text-center py-16'>
						<div className='max-w-md mx-auto'>
							<div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
								{searchTerm ? (
									<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								) : (
									<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								)}
							</div>
							{searchTerm ? (
								<>
									<h3 className='text-xl font-semibold text-gray-800 mb-2'>No groups found</h3>
									<p className='text-gray-500 mb-6'>
										No groups match your search for "{searchTerm}". Try a different search term.
									</p>
									<button
										onClick={() => setSearchTerm('')}
										className='text-indigo-600 hover:text-indigo-800 font-medium'
									>
										Clear search
									</button>
								</>
							) : (
								<>
									<h3 className='text-xl font-semibold text-gray-800 mb-2'>No groups yet</h3>
									<p className='text-gray-500 mb-8'>
										Get started by creating your first expense group to share costs with friends, family, or colleagues.
									</p>
									<button
										onClick={() => setShowCreateForm(true)}
										className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
									>
										Create Your First Group
									</button>
								</>
							)}
						</div>
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						{filteredGroups.map((group) => (
							<div
								key={group.id}
								className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer transform hover:-translate-y-1'
								onClick={() => navigate(`/groups/${group.id}`)}
							>
								{/* Group Header */}
								<div className='flex items-start justify-between mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
										<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
									<svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</div>

								{/* Group Info */}
								<div className='mb-4'>
									<h3 className='text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-200 mb-2 line-clamp-2'>
										{group.name}
									</h3>
									<div className='flex items-center text-sm text-gray-500 mb-3'>
										<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V7a2 2 0 00-2 2H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2z" />
										</svg>
										Created: {new Date(group.created_at).toLocaleDateString()}
									</div>
								</div>

								{/* Group Stats */}
								<div className='space-y-3 mb-4'>
									<div className='flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg'>
										<div className='flex items-center gap-2'>
											<svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
											<span className='text-sm font-medium text-gray-600'>Members</span>
										</div>
										<span className='text-sm font-bold text-gray-800'>
											{groupStats[group.id]?.members ?? <span className="text-gray-400">...</span>}
										</span>
									</div>
									<div className='flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg'>
										<div className='flex items-center gap-2'>
											<svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span className='text-sm font-medium text-gray-600'>Expenses</span>
										</div>
										<span className='text-sm font-bold text-gray-800'>
											{groupStats[group.id]?.expenses ?? <span className="text-gray-400">...</span>}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Create Group Modal */}
			<CreateGroupModal
				isOpen={showCreateForm}
				onClose={() => setShowCreateForm(false)}
				onSuccess={handleGroupCreated}
				userId={auth.user.id}
			/>
		</div>
	);
};

export default Groups;