import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const Dashboard = () => {
	const { auth } = useAuth();
	const user = auth?.user;
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	if (!auth || !auth.user) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='text-xl'>Please log in to view dashboard</div>
			</div>
		);
	}

	useEffect(() => {
		if (user) {
			fetchUserGroups();
		}
	}, [user]);

	const fetchUserGroups = async () => {
		try {
			console.log('Fetching groups for user:', user.id);
			const response = await apiClient.get(
				`/api/users/${user.id}/groups`
			);
			console.log('Groups response:', response.data);
			setGroups(response.data);
		} catch (err) {
			console.error('Error fetching groups:', err);
			setError('Failed to load groups');
		} finally {
			setLoading(false);
		}
	};

	if (!user) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='text-xl'>Loading user data...</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='text-xl'>Loading...</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-800'>
					Welcome back, {user.email}!
				</h1>
				<p className='text-gray-600 mt-2'>
					Manage your expense groups and track shared expenses.
				</p>
			</div>

			{error && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
					{error}
				</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{/* Quick Actions */}
				<div className='bg-white rounded-lg shadow-md p-6'>
					<h2 className='text-xl font-semibold mb-4'>
						Quick Actions
					</h2>
					<div className='space-y-3'>
						<button
							onClick={() => navigate('/groups')}
							className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors'
						>
							Create New Group
						</button>
						<button
							onClick={() => navigate('/expenses')}
							className='w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors'
						>
							View Expenses
						</button>
					</div>
				</div>

				{/* Your Groups */}
				<div className='bg-white rounded-lg shadow-md p-6'>
					<h2 className='text-xl font-semibold mb-4'>Your Groups</h2>
					{groups.length === 0 ? (
						<div>
							<p className='text-gray-500 mb-4'>
								No groups yet. Create your first group!
							</p>
							<button
								onClick={() => navigate('/groups')}
								className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors'
							>
								Create Group
							</button>
						</div>
					) : (
						<div className='space-y-3'>
							{groups.slice(0, 3).map((group) => (
								<div
									key={group.id}
									className='border rounded p-3 hover:bg-gray-50 cursor-pointer'
									onClick={() => navigate(`/groups/${group.id}`)}
								>
									<h3 className='font-medium'>
										{group.name}
									</h3>
									<p className='text-sm text-gray-600'>
										Created:{' '}
										{new Date(
											group.created_at
										).toLocaleDateString()}
									</p>
								</div>
							))}
							{groups.length > 3 && (
								<button
									onClick={() => navigate('/groups')}
									className='w-full text-blue-500 hover:text-blue-700 text-sm'
								>
									View all {groups.length} groups →
								</button>
							)}
						</div>
					)}
				</div>

				{/* Recent Activity */}
				<div className='bg-white rounded-lg shadow-md p-6'>
					<h2 className='text-xl font-semibold mb-4'>
						Recent Activity
					</h2>
					<div className='space-y-3'>
						<div className='text-sm text-gray-600'>
							<p>
								• Joined {groups.length} group
								{groups.length !== 1 ? 's' : ''}
							</p>
							<p>• No recent expenses</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
