import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const Groups = () => {
	const { auth } = useAuth();
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');

	useEffect(() => {
		fetchGroups();
	}, []);

	const fetchGroups = async () => {
		try {
			const response = await apiClient.get('/api/groups');
			setGroups(response.data);
		} catch (err) {
			setError('Failed to load groups');
			console.error('Error fetching groups:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateGroup = async (e) => {
		e.preventDefault();
		try {
			await apiClient.post('/api/groups', {
				name: newGroupName,
				created_by: auth.user.id
			});
			setNewGroupName('');
			setShowCreateForm(false);
			fetchGroups();
		} catch (err) {
			setError('Failed to create group');
			console.error('Error creating group:', err);
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='text-xl'>Loading...</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-3xl font-bold text-gray-800'>Groups</h1>
				<button
					onClick={() => setShowCreateForm(true)}
					className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors'
				>
					Create Group
				</button>
			</div>

			{error && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
					{error}
				</div>
			)}

			{/* Create Group Modal */}
			{showCreateForm && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-md'>
						<h2 className='text-xl font-semibold mb-4'>
							Create New Group
						</h2>
						<form onSubmit={handleCreateGroup}>
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									Group Name
								</label>
								<input
									type='text'
									value={newGroupName}
									onChange={(e) =>
										setNewGroupName(e.target.value)
									}
									className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
									required
								/>
							</div>
							<div className='flex justify-end space-x-3'>
								<button
									type='button'
									onClick={() => setShowCreateForm(false)}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
								>
									Create
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Groups List */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{groups.map((group) => (
					<div
						key={group.id}
						className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
					>
						<h3 className='text-xl font-semibold mb-2'>
							{group.name}
						</h3>
						<p className='text-gray-600 mb-4'>
							Created: {new Date(group.created_at).toLocaleDateString()}
						</p>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-gray-500'>
								Group ID: {group.id}
							</span>
							<button
								onClick={() => navigate(`/groups/${group.id}`)}
								className='bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600'
							>
								View Details
							</button>
						</div>
					</div>
				))}
			</div>

			{groups.length === 0 && (
				<div className='text-center py-12'>
					<p className='text-gray-500 text-lg'>
						No groups yet. Create your first group!
					</p>
				</div>
			)}
		</div>
	);
};

export default Groups;
 