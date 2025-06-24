import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import ConfirmationModal from './ConfirmationModal';
import EditExpenseModal from './EditExpenseModal';

const GroupDetails = () => {
	const { groupId } = useParams();
	const navigate = useNavigate();
	const { auth } = useAuth();
	const [group, setGroup] = useState(null);
	const [expenses, setExpenses] = useState([]);
	const [groupMembers, setGroupMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showAddExpense, setShowAddExpense] = useState(false);
	const [newExpense, setNewExpense] = useState({
		description: '',
		total_amount: '',
		payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
		shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
	});
	const [editingExpense, setEditingExpense] = useState(null);
	const [showEditExpense, setShowEditExpense] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [expenseToDelete, setExpenseToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editGroupMode, setEditGroupMode] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState(null);
	const [isRemovingMember, setIsRemovingMember] = useState(false);
	const [summary, setSummary] = useState([]);
	const [summaryLoading, setSummaryLoading] = useState(true);
	const isCreator = auth?.user?.id === group?.created_by;
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState('');

	useEffect(() => {
		fetchGroupDetails();
		fetchGroupExpenses();
		fetchGroupMembers();
		fetchSummary();
	}, [groupId]);

	const fetchGroupDetails = async () => {
		try {
			const response = await apiClient.get(`/api/groups/${groupId}`);
			setGroup(response.data);
		} catch (err) {
			toast.error('Failed to load group details');
			console.error('Error fetching group:', err);
		}
	};

	const fetchGroupExpenses = async () => {
		try {
			const response = await apiClient.get(`/api/groups/${groupId}/expenses`);
			const expenses = response.data;
	
			// Fetch details for each expense in parallel
			const detailedExpenses = await Promise.all(
				expenses.map(async (expense) => {
					const detailsResp = await apiClient.get(`/api/expenses/${expense.id}/details`);
					return {
						...expense,
						payers: detailsResp.data.payers,
						shares: detailsResp.data.shares,
					};
				})
			);
	
			setExpenses(detailedExpenses);
		} catch (err) {
			toast.error('Failed to load expenses');
			console.error('Error fetching expenses:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchGroupMembers = async () => {
		try {
			const response = await apiClient.get(
				`/api/groups/${groupId}/members`
			);
			setGroupMembers(response.data.members);
		} catch (err) {
			console.error('Error fetching group members:', err);
		}
	};

	const fetchSummary = async () => {
		setSummaryLoading(true);
		try {
			const response = await apiClient.get(
				`/api/groups/${groupId}/summary`
			);
			setSummary(response.data);
		} catch (err) {
			console.error('Error fetching group summary:', err);
			// You can set a specific error for the summary if you want
		} finally {
			setSummaryLoading(false);
		}
	};

	const handleRemoveMember = (member) => {
		setMemberToRemove(member);
		setShowRemoveMemberConfirm(true);
	};

	const confirmRemoveMember = async () => {
		if (!memberToRemove) return;

		setIsRemovingMember(true);
		try {
			await apiClient.delete(
				`/api/groups/${groupId}/members/${memberToRemove.id}`
			);
			toast.success(`Member ${memberToRemove.email} removed successfully`);
			fetchGroupMembers(); // Refresh members list
			fetchSummary(); // Refresh the summary
		} catch (err) {
			toast.error('Failed to remove member');
			console.error('Error removing member:', err);
		} finally {
			setIsRemovingMember(false);
			setShowRemoveMemberConfirm(false);
			setMemberToRemove(null);
		}
	};

	const addPayer = () => {
		setNewExpense({
			...newExpense,
			payers: [...newExpense.payers, { user_id: '', paid_amount: '' }],
		});
	};

	const addShare = () => {
		setNewExpense({
			...newExpense,
			shares: [...newExpense.shares, { user_id: '', share_amount: '' }],
		});
	};

	const updatePayer = (index, field, value) => {
		const updatedPayers = [...newExpense.payers];
		updatedPayers[index] = { ...updatedPayers[index], [field]: value };
		setNewExpense({ ...newExpense, payers: updatedPayers });
	};

	const updateShare = (index, field, value) => {
		const updatedShares = [...newExpense.shares];
		updatedShares[index] = { ...updatedShares[index], [field]: value };
		setNewExpense({ ...newExpense, shares: updatedShares });
	};

	const removePayer = (index) => {
		if (newExpense.payers.length > 1) {
			const updatedPayers = newExpense.payers.filter(
				(_, i) => i !== index
			);
			setNewExpense({ ...newExpense, payers: updatedPayers });
		}
	};

	const removeShare = (index) => {
		if (newExpense.shares.length > 1) {
			const updatedShares = newExpense.shares.filter(
				(_, i) => i !== index
			);
			setNewExpense({ ...newExpense, shares: updatedShares });
		}
	};

	const validateExpense = (expense) => {
		if (!expense) return ['No expense data to validate.'];
		const totalPaid = expense.payers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount || 0),
			0
		);
		const totalShares = expense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		const totalAmount = parseFloat(expense.total_amount || 0);

		const errors = [];
		const tolerance = 0.001; 

		if (Math.abs(totalPaid - totalAmount) > tolerance) {
			errors.push(
				`Total paid ($${totalPaid.toFixed(
					2
				)}) must equal total amount ($${totalAmount.toFixed(2)})`
			);
		}

		if (Math.abs(totalShares - totalAmount) > tolerance) {
			errors.push(
				`Total shares ($${totalShares.toFixed(
					2
				)}) must equal total amount ($${totalAmount.toFixed(2)})`
			);
		}

		return errors;
	};

	const handleAddExpense = async (e) => {
		e.preventDefault();

		const validationErrors = validateExpense(newExpense);
		if (validationErrors.length > 0) {
			toast.error(validationErrors.join('. '));
			return;
		}

		try {
			const expenseData = {
				...newExpense,
				group_id: parseInt(groupId),
				total_amount: parseFloat(newExpense.total_amount),
				payers: newExpense.payers.map((p) => ({
					...p,
					user_id: parseInt(p.user_id),
					paid_amount: parseFloat(p.paid_amount),
				})),
				shares: newExpense.shares.map((s) => ({
					...s,
					user_id: parseInt(s.user_id),
					share_amount: parseFloat(s.share_amount),
				})),
			};

			await apiClient.post('/api/expenses', expenseData);
			setShowAddExpense(false);
			setNewExpense({
				description: '',
				total_amount: '',
				payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
				shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
			});
			
			toast.success('Expense added successfully');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			
			toast.error('Failed to add expense');
			console.error('Error adding expense:', err);
		}
	};

	// reset the expense form
	const resetExpenseForm = () => {
		setNewExpense({
			description: '',
			total_amount: '',
			payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
			shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
		});
	};

	const handleEditExpense = async (expenseId) => {
		try {
			const response = await apiClient.get(
				`/api/expenses/${expenseId}/details`
			);
			const expenseData = response.data;

			setEditingExpense({
				id: expenseData.expense.id,
				description: expenseData.expense.description,
				total_amount: expenseData.expense.total_amount.toString(),
				payers: expenseData.payers.map((payer) => ({
					user_id: payer.user_id.toString(),
					paid_amount: payer.paid_amount.toString(),
				})),
				shares: expenseData.shares.map((share) => ({
					user_id: share.user_id.toString(),
					share_amount: share.share_amount.toString(),
				})),
			});
			setShowEditExpense(true);
		} catch (err) {
			
			console.error('Error loading expense:', err);
		}
	};

	const handleUpdateExpense = async (e) => {
		e.preventDefault();

		const validationErrors = validateExpense(editingExpense);
		if (validationErrors.length > 0) {
			toast.error(validationErrors.join('. '));
			return;
		}

		try {
			const expenseData = {
				description: editingExpense.description,
				total_amount: parseFloat(editingExpense.total_amount),
				payers: editingExpense.payers.map((p) => ({
					user_id: parseInt(p.user_id),
					paid_amount: parseFloat(p.paid_amount),
				})),
				shares: editingExpense.shares.map((s) => ({
					user_id: parseInt(s.user_id),
					share_amount: parseFloat(s.share_amount),
				})),
			};

			await apiClient.put(
				`/api/expenses/${editingExpense.id}`,
				expenseData
			);
			setShowEditExpense(false);
			setEditingExpense(null);
			
			toast.success('Expense updated successfully');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			
			toast.error('Failed to update expense');
			console.error('Error updating expense:', err);
		}
	};

	const handleDeleteExpense = async (expenseId) => {
		setExpenseToDelete(expenseId); // Store the ID in state
		setShowDeleteConfirm(true); // Show the confirmation modal
	};

	const confirmDeleteExpense = async () => {
		setIsDeleting(true);
		try {
			// expenseToDelete contains the ID we stored earlier
			await apiClient.delete(`/api/expenses/${expenseToDelete}`);
			
			toast.success('Expense deleted successfully');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			
			toast.error('Failed to delete expense');
			console.error('Error deleting expense:', err);
		} finally {
			setIsDeleting(false);
			setShowDeleteConfirm(false);
			setExpenseToDelete(null); // Clear the stored ID
		}
	};

	const handleEditGroup = () => {
		setEditGroupMode(true);
		setNewGroupName(group.name);
	};

	const handleEditGroupSubmit = async (e) => {
		e.preventDefault();
		try {
			await apiClient.put(`/api/groups/${groupId}`, {
				name: newGroupName,
			});
			setEditGroupMode(false);
			
			toast.success('Group name updated!');
			fetchGroupDetails();
		} catch (err) {
			
			toast.error('Failed to update group name');
		}
	};

	const handleDeleteGroup = async () => {
		if (!window.confirm('Are you sure you want to delete this group?'))
			return;
		setIsDeleting(true);
		try {
			await apiClient.delete(`/api/groups/${groupId}`);
			navigate('/groups');
			toast.success('Group deleted successfully');
		} catch (err) {
		
			toast.error('Failed to delete group');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSendInvite = async (e) => {
		e.preventDefault();
		setInviteLoading(true);
		setInviteError('');
		try {
			await apiClient.post(`/api/groups/${groupId}/invite`, { email: inviteEmail });
			toast.success('Invitation sent!');
			setInviteEmail('');
		} catch (err) {
			setInviteError(err.response?.data?.detail || 'Failed to send invite');
			toast.error(err.response?.data?.detail || 'Failed to send invite');
		} finally {
			setInviteLoading(false);
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='text-xl'>Loading...</div>
			</div>
		);
	}

	if (!group) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-red-600'>
						Group not found
					</h1>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-800'>
					{group.name}
				</h1>
				<p className='text-gray-600 mt-2'>Group Details</p>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Expenses Section (Left Column) */}
				<div className='lg:col-span-2 bg-white rounded-lg shadow-md p-6'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-xl font-semibold'>Expenses</h2>
						<button
							onClick={() => setShowAddExpense(true)}
							className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors'
						>
							Add Expense
						</button>
					</div>

					<div className='space-y-4'>
						{expenses.map((expense) => (
							<div
								key={expense.id}
								className='border rounded p-4'
							>
								<div className='flex justify-between items-start'>
									<div>
										<h3 className='font-medium'>
											{expense.description ||
												'No description'}
										</h3>
										<p className='text-sm text-gray-600'>
											{new Date(
												expense.created_at
											).toLocaleDateString()}
										</p>
										<div className="mt-2 text-sm text-gray-700">
											<span className="font-semibold">Paid by: </span>
											{expense.payers && expense.payers.length > 0 ? (
												expense.payers.map((payer, idx) => {
													const user = groupMembers.find(u => u.id === payer.user_id);
													return (
														<span key={payer.user_id}>
															{user ? user.name : 'Unknown'} (${payer.paid_amount.toFixed(2)})
															{idx < expense.payers.length - 1 ? ', ' : ''}
														</span>
													);
												})
											) : (
												<span>Unknown</span>
											)}
										</div>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='text-lg font-semibold text-green-600'>
											${expense.total_amount.toFixed(2)}
										</span>
										<div className='flex space-x-1'>
											<button
												onClick={() =>
													handleEditExpense(
														expense.id
													)
												}
												className='p-1 text-blue-500 hover:text-blue-700'
												title='Edit expense'
											>
												<svg
													className='w-4 h-4'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
													/>
												</svg>
											</button>
											<button
												onClick={() =>
													handleDeleteExpense(
														expense.id
													)
												}
												className='p-1 text-red-500 hover:text-red-700'
												title='Delete expense'
											>
												<svg
													className='w-4 h-4'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
													/>
												</svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{expenses.length === 0 && (
						<p className='text-gray-500 text-center py-4'>
							No expenses yet
						</p>
					)}
				</div>

				{/* Group Info, Members, and Summary (Right Column) */}
				<div className='space-y-6'>
					{/* Group Info Card */}
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h2 className='text-xl font-semibold mb-4'>
							Group Information
						</h2>
						<div className='space-y-3'>
							<div>
								<span className='font-medium'>Name:</span>{' '}
								{group.name}
							</div>
							<div>
								<span className='font-medium'>Created:</span>{' '}
								{new Date(
									group.created_at
								).toLocaleDateString()}
							</div>
							<div>
								<span className='font-medium'>
									Total Expenses:
								</span>{' '}
								{expenses.length}
							</div>
							<div>
								<span className='font-medium'>
									Total Amount:
								</span>{' '}
								$
								{expenses
									.reduce(
										(sum, expense) =>
											sum + expense.total_amount,
										0
									)
									.toFixed(2)}
							</div>
						</div>
					</div>

					{/* Summary Card */}
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h2 className='text-xl font-semibold mb-4'>Summary</h2>
						{summaryLoading ? (
							<p className='text-gray-500'>
								Calculating balances...
							</p>
						) : summary.length > 0 ? (
							<ul className='space-y-3'>
								{summary.map((debt, index) => {
									const isYouOwe =
										debt.from_user.id === auth.user.id;
									const isYouReceive =
										debt.to_user.id === auth.user.id;
									const fromName = isYouOwe ? (
										<span className='font-bold text-blue-600'>
											You
										</span>
									) : (
										<span className='font-bold'>
											{debt.from_user.name}
										</span>
									);
									const toName = isYouReceive ? (
										<span className='font-bold text-blue-600'>
											You
										</span>
									) : (
										<span className='font-bold'>
											{debt.to_user.name}
										</span>
									);

									return (
										<li
											key={index}
											className='flex items-center text-gray-700'
										>
											<span
												className={
													isYouOwe
														? 'text-red-600'
														: isYouReceive
														? 'text-green-600'
														: ''
												}
											>
												{fromName} owes {toName}
											</span>
											<svg
												xmlns='http://www.w3.org/2000/svg'
												className='h-4 w-4 mx-2 text-gray-400'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M17 8l4 4m0 0l-4 4m4-4H3'
												/>
											</svg>
											<span className='ml-2 font-bold text-gray-800'>
												${debt.amount.toFixed(2)}
											</span>
										</li>
									);
								})}
							</ul>
						) : (
							<p className='text-gray-500 text-center py-4'>
								✅ Everyone is settled up!
							</p>
						)}
					</div>

					{/* Members Card */}
					<div className='bg-white rounded-lg shadow-md p-6'>
						<h2 className='text-xl font-semibold mb-4'>
							Members ({groupMembers.length})
						</h2>

						{isCreator && (
							<form onSubmit={handleSendInvite} className='mb-4 flex gap-2 items-center'>
								<input
									type='email'
									value={inviteEmail}
									onChange={e => setInviteEmail(e.target.value)}
									placeholder="Invite by email"
									className='p-2 border border-gray-300 rounded w-full'
									required
									disabled={inviteLoading}
								/>
								<button
									type='submit'
									className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50'
									disabled={inviteLoading || !inviteEmail}
								>
									{inviteLoading ? '...' : 'Invite'}
								</button>
							</form>
						)}
						{inviteError && <div className='text-red-500 text-sm mb-2'>{inviteError}</div>}

						<ul className='space-y-3'>
							{groupMembers.map((member) => (
								<li
									key={member.id}
									className='flex justify-between items-center p-2 rounded hover:bg-gray-50'
								>
									<div>
										<span className='font-medium'>{member.name}</span>
									</div>
									<div className='flex items-center space-x-2'>
										{member.id === group.created_by && (
											<span className='text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full'>
												Creator
											</span>
										)}
										{member.id === auth.user.id && !isCreator && (
											<span className='text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
												You
											</span>
										)}
										{isCreator && member.id !== auth.user.id && (
											<button
												onClick={() => handleRemoveMember(member)}
												className='text-red-500 hover:text-red-700 text-xs'
												title='Remove member'
											>
												Remove
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* Admin Actions for Creator */}
					{isCreator && (
						<div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500'>
							<h2 className='text-xl font-semibold mb-4'>
								Admin Actions
							</h2>
							<div className='flex space-x-2'>
								<button
									onClick={handleEditGroup}
									className='bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600'
								>
									Edit Group
								</button>
								<button
									onClick={handleDeleteGroup}
									className='bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600'
									disabled={isDeleting}
								>
									{isDeleting ? 'Deleting...' : 'Delete Group'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Add new expense Modal */}
			<EditExpenseModal
				isOpen={showAddExpense}
				onClose={() => {
					setShowAddExpense(false);
					resetExpenseForm();
				}}
				onUpdate={handleAddExpense}
				expense={newExpense}
				setExpense={setNewExpense}
				groupMembers={groupMembers}
				title='Add New Expense'
				submitText='Add Expense'
			/>
			
			{/* Edit existing expense */}
			<EditExpenseModal
				isOpen={showEditExpense}
				onClose={() => {
										setShowEditExpense(false);
										setEditingExpense(null);
					
				}}
				onUpdate={handleUpdateExpense}
				expense={editingExpense}
				setExpense={setEditingExpense}
				groupMembers={groupMembers}
				title='Edit Expense'
				submitText='Update Expense'
			/>

			{/* Confirmation Modals */}
			<ConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => {
					setShowDeleteConfirm(false);
					setExpenseToDelete(null);
				}}
				onConfirm={confirmDeleteExpense}
				title='Delete Expense'
				message='Are you sure you want to delete this expense? This action cannot be undone.'
				confirmText='Delete'
				cancelText='Cancel'
				confirmColor='red'
				icon='delete'
				isLoading={isDeleting}
				loadingText='Deleting...'
			/>

			{editGroupMode && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-md'>
						<h2 className='text-xl font-semibold mb-4'>
							Edit Group Name
						</h2>
						<form onSubmit={handleEditGroupSubmit}>
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									New Group Name
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
									onClick={() => setEditGroupMode(false)}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
								>
									Save
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<ConfirmationModal
				isOpen={showRemoveMemberConfirm}
				onClose={() => setShowRemoveMemberConfirm(false)}
				onConfirm={confirmRemoveMember}
				message={`Are you sure you want to remove ${memberToRemove?.name} from the group?`}
				confirmText="Remove"
				confirmColor="red"
				icon="delete"
				isLoading={isRemovingMember}
				loadingText="Removing..."
			/>
		</div>
	);
};

export default GroupDetails;
