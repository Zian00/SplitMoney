import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

const CreateGroupModal = ({ isOpen, onClose, onSuccess, userId }) => {
	const [newGroupName, setNewGroupName] = useState('');
	const [createGroupError, setCreateGroupError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Add useEffect to handle body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Cleanup function to restore scroll when component unmounts
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setNewGroupName('');
		}
	}, [isOpen]);

	const handleCreateGroup = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await apiClient.post('/api/groups', {
				name: newGroupName,
				created_by: userId,
			});
			setNewGroupName('');
			onClose();
			onSuccess();
			toast.success('Group created successfully!');
		} catch (err) {
            toast.err('Failed to create group');
			console.error('Error creating group:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setNewGroupName('');
		setCreateGroupError('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200'>
			<div className='bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center'>
						<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
					</div>
					<h2 className='text-xl font-bold text-gray-800'>Create New Group</h2>
				</div>

				<form onSubmit={handleCreateGroup}>
					<div className='mb-6'>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Group Name
						</label>
						<input
							type='text'
							value={newGroupName}
							onChange={(e) => setNewGroupName(e.target.value)}
							className='w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200'
							placeholder='Enter group name...'
							required
							disabled={isLoading}
						/>
						<p className='text-xs text-gray-500 mt-2'>
							Choose a descriptive name for your expense group
						</p>
					</div>

					<div className='flex flex-col sm:flex-row justify-end gap-3'>
						<button
							type='button'
							onClick={handleCancel}
							disabled={isLoading}
							className='px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isLoading || !newGroupName.trim()}
							className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg'
						>
							{isLoading ? (
								<>
									<svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Creating...
								</>
							) : (
								<>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Group
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreateGroupModal; 