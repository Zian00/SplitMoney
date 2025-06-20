import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const Profile = () => {
	const { auth, setAuth } = useAuth();
	const [name, setName] = useState(auth.user.name);
	const [editing, setEditing] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');

	const handleSave = async () => {
		setError('');
		setMessage('');
		try {
			await apiClient.put('/auth/users/me/name', { name });
			setAuth({ ...auth, user: { ...auth.user, name } });
			setEditing(false);
			setMessage('Name updated!');
		} catch (err) {
			setError('Failed to update name');
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">Profile</h1>
			{error && <div className="text-red-500 mb-2">{error}</div>}
			{message && <div className="text-green-500 mb-2">{message}</div>}
			<div className="bg-white rounded-lg shadow-md p-6 max-w-md">
				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Email</label>
					<div className="p-2 border border-gray-200 rounded bg-gray-50">{auth.user.email}</div>
				</div>
				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Name</label>
					{editing ? (
						<div className="flex space-x-2">
							<input
								type="text"
								value={name}
								onChange={e => setName(e.target.value)}
								className="p-2 border border-gray-300 rounded flex-1"
							/>
							<button
								onClick={handleSave}
								className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
							>
								Save
							</button>
							<button
								onClick={() => {
									setEditing(false);
									setName(auth.user.name);
								}}
								className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
							>
								Cancel
							</button>
						</div>
					) : (
						<div className="flex items-center space-x-3">
							<span>{auth.user.name}</span>
							<button
								onClick={() => setEditing(true)}
								className="text-blue-500 hover:underline text-sm"
							>
								Edit
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Profile;
