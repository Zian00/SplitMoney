import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import ConfirmationModal from './ConfirmationModal';

const GroupDetails = () => {
	const { groupId } = useParams();
	const navigate = useNavigate();
	const { auth } = useAuth();
	const [group, setGroup] = useState(null);
	const [expenses, setExpenses] = useState([]);
	const [groupMembers, setGroupMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showAddExpense, setShowAddExpense] = useState(false);
	const [showAddMember, setShowAddMember] = useState(false);
	const [newMemberEmail, setNewMemberEmail] = useState('');
	const [newExpense, setNewExpense] = useState({
		description: '',
		total_amount: '',
		payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
		shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
	});
	const [splitMode, setSplitMode] = useState('equal');
	const [autoCalculateShares, setAutoCalculateShares] = useState(true);
	const [editingExpense, setEditingExpense] = useState(null);
	const [showEditExpense, setShowEditExpense] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [expenseToDelete, setExpenseToDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editGroupMode, setEditGroupMode] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [addMemberError, setAddMemberError] = useState('');

	const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] =
		useState(false);
	const [memberToRemove, setMemberToRemove] = useState(null);
	const [isRemovingMember, setIsRemovingMember] = useState(false);

	const [summary, setSummary] = useState([]);
	const [summaryLoading, setSummaryLoading] = useState(true);

	const isCreator = auth?.user?.id === group?.created_by;

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
			setError('Failed to load group details');
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
			setError('Failed to load expenses');
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

	const handleAddMember = async (e) => {
		e.preventDefault();
		setAddMemberError('');
		setSuccess('');

		try {
			const response = await apiClient.post(
				`/api/groups/${groupId}/add-member`,
				{
					email: newMemberEmail,
				}
			);

			setSuccess(response.data.message);
			setNewMemberEmail('');
			setShowAddMember(false);
			fetchGroupMembers(); // Refresh members list
			fetchSummary(); // Refresh the summary
		} catch (err) {
			setAddMemberError(
				err.response?.data?.detail || 'Failed to add member'
			);
			console.error('Error adding member:', err);
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
			setSuccess(`Member ${memberToRemove.email} removed successfully`);
			fetchGroupMembers(); // Refresh members list
			fetchSummary(); // Refresh the summary
		} catch (err) {
			setError('Failed to remove member');
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

	const validateExpense = () => {
		const totalPaid = newExpense.payers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount || 0),
			0
		);
		const totalShares = newExpense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		const totalAmount = parseFloat(newExpense.total_amount || 0);

		const errors = [];

		// Use a smaller tolerance for precision issues
		const tolerance = 0.001; // 0.1 cents tolerance

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

		const validationErrors = validateExpense();
		if (validationErrors.length > 0) {
			setError(validationErrors.join('. '));
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
			setError('');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			setError('Failed to add expense');
			console.error('Error adding expense:', err);
		}
	};

	const calculateTotals = () => {
		const totalPaid = newExpense.payers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount || 0),
			0
		);
		const totalShares = newExpense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		const totalAmount = parseFloat(newExpense.total_amount || 0);

		return { totalPaid, totalShares, totalAmount };
	};

	// Add this function to handle precision issues
	const calculateEqualShares = (totalAmount, memberCount) => {
		const baseShare = totalAmount / memberCount;
		const shares = [];

		// Calculate initial shares (all rounded down)
		for (let i = 0; i < memberCount; i++) {
			shares.push(Math.floor(baseShare * 100) / 100);
		}

		// Calculate total rounded down
		const totalRounded = shares.reduce((sum, share) => sum + share, 0);
		const remainder = Math.round((totalAmount - totalRounded) * 100); // Convert to cents

		// Distribute the remainder (in cents) one by one
		for (let i = 0; i < remainder; i++) {
			shares[i] = Math.round((shares[i] + 0.01) * 100) / 100;
		}

		return shares;
	};

	// Update the calculateSharesFromPayers function
	const calculateSharesFromPayers = () => {
		if (!autoCalculateShares || splitMode === 'custom') return;

		const totalAmount = parseFloat(newExpense.total_amount || 0);
		if (totalAmount <= 0) return;

		const validPayers = newExpense.payers.filter(
			(payer) => payer.user_id && payer.paid_amount
		);
		if (validPayers.length === 0) return;

		let newShares = [];

		if (splitMode === 'equal') {
			// Use the precision-safe equal split
			const equalShares = calculateEqualShares(
				totalAmount,
				groupMembers.length
			);

			newShares = groupMembers.map((member, index) => ({
				user_id: member.id,
				share_amount: equalShares[index].toFixed(2),
			}));
		} else if (splitMode === 'percentage') {
			// Proportional split based on who paid
			const totalPaid = validPayers.reduce(
				(sum, payer) => sum + parseFloat(payer.paid_amount),
				0
			);

			// Calculate proportional shares with precision handling
			const proportionalShares = validPayers.map((payer) => {
				const percentage = parseFloat(payer.paid_amount) / totalPaid;
				const share = totalAmount * percentage;
				return Math.round(share * 100) / 100; // Round to 2 decimal places
			});

			// Handle any remaining precision issues
			const totalCalculated = proportionalShares.reduce(
				(sum, share) => sum + share,
				0
			);
			const difference = totalAmount - totalCalculated;

			if (Math.abs(difference) > 0.001) {
				proportionalShares[0] =
					Math.round((proportionalShares[0] + difference) * 100) /
					100;
			}

			newShares = validPayers.map((payer, index) => ({
				user_id: payer.user_id,
				share_amount: proportionalShares[index].toFixed(2),
			}));
		}

		setNewExpense({
			...newExpense,
			shares: newShares,
		});
	};

	useEffect(() => {
		if (autoCalculateShares) {
			calculateSharesFromPayers();
		}
	}, [
		newExpense.payers,
		newExpense.total_amount,
		splitMode,
		autoCalculateShares,
	]);

	const calculateRemainingAmount = () => {
		const totalAmount = parseFloat(newExpense.total_amount || 0);
		const totalPaid = newExpense.payers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount || 0),
			0
		);
		const totalShares = newExpense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);

		return {
			totalAmount,
			totalPaid,
			totalShares,
			remainingPaid: totalAmount - totalPaid,
			remainingShares: totalAmount - totalShares,
		};
	};

	const autoBalanceShares = () => {
		const totalAmount = parseFloat(newExpense.total_amount || 0);
		const currentTotal = newExpense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		const remaining = totalAmount - currentTotal;

		if (remaining > 0) {
			// Add remaining amount to the first share with 0 amount
			const firstEmptyShare = newExpense.shares.find(
				(share) =>
					!share.share_amount || parseFloat(share.share_amount) === 0
			);
			if (firstEmptyShare) {
				const shareIndex = newExpense.shares.indexOf(firstEmptyShare);
				updateShare(shareIndex, 'share_amount', remaining.toFixed(2));
			}
		}
	};

	// Replace the existing getAvailableUsers function with this:
	const getAvailableUsersForPayer = (currentIndex) => {
		const selectedUserIds = newExpense.payers
			.map((payer, i) => (i !== currentIndex ? payer.user_id : null))
			.filter((id) => id && id !== '')
			.map((id) => String(id)); // Convert to string for consistent comparison

		return groupMembers.filter(
			(member) => !selectedUserIds.includes(String(member.id))
		);
	};

	const getAvailableUsersForShare = (currentIndex) => {
		const selectedUserIds = newExpense.shares
			.map((share, i) => (i !== currentIndex ? share.user_id : null))
			.filter((id) => id && id !== '')
			.map((id) => String(id)); // Convert to string for consistent comparison

		return groupMembers.filter(
			(member) => !selectedUserIds.includes(String(member.id))
		);
	};

	// reset the expense form
	const resetExpenseForm = () => {
		setNewExpense({
			description: '',
			total_amount: '',
			payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
			shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
		});
		setSplitMode('equal');
		setAutoCalculateShares(true);
		setError('');
	};

	// reset the member form
	const resetMemberForm = () => {
		setNewMemberEmail('');
		setError('');
		setSuccess('');
		setAddMemberError('');
	};

	// Update the modal close logic
	const closeExpenseModal = () => {
		resetExpenseForm();
		setShowAddExpense(false);
	};

	const closeMemberModal = () => {
		resetMemberForm();
		setShowAddMember(false);
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
			setError('Failed to load expense details');
			console.error('Error loading expense:', err);
		}
	};

	const handleUpdateExpense = async (e) => {
		e.preventDefault();

		const validationErrors = validateExpense();
		if (validationErrors.length > 0) {
			setError(validationErrors.join('. '));
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
			setError('');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			setError('Failed to update expense');
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
			setSuccess('Expense deleted successfully');
			fetchGroupExpenses();
			fetchSummary(); // Refresh the summary
		} catch (err) {
			setError('Failed to delete expense');
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
			setSuccess('Group name updated!');
			fetchGroupDetails();
		} catch (err) {
			setError('Failed to update group name');
		}
	};

	const handleDeleteGroup = async () => {
		if (!window.confirm('Are you sure you want to delete this group?'))
			return;
		setIsDeleting(true);
		try {
			await apiClient.delete(`/api/groups/${groupId}`);
			navigate('/groups');
		} catch (err) {
			setError('Failed to delete group');
		} finally {
			setIsDeleting(false);
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

	const { totalPaid, totalShares, totalAmount } = calculateTotals();

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-800'>
					{group.name}
				</h1>
				<p className='text-gray-600 mt-2'>Group Details</p>
			</div>

			{error && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
					{error}
				</div>
			)}

			{success && (
				<div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>
					{success}
				</div>
			)}

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Expenses Section */}
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
										{/* Transaction Preview */}
										<div className="mt-2 text-sm text-gray-700">
											<span className="font-semibold">Paid by: </span>
											{/* {console.log('Rendering payers for expense:', expense.payers)} */}
											{expense.payers && expense.payers.length > 0 ? (
												
												expense.payers.map((payer, idx) => {
													// console.log('groupMembers:', groupMembers);
													// console.log('payer:', payer);

													// Find the user name/email from groupMembers
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
											${expense.total_amount}
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

				{/* Group Info and Members */}
				<div className='space-y-6'>
					{/* Group Info */}
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

					{/* Summary Section */}
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
											{isYouOwe && (
												<span className='ml-2 text-xs text-red-500 font-semibold'>
													(You have to pay)
												</span>
											)}
											{isYouReceive && (
												<span className='ml-2 text-xs text-green-500 font-semibold'>
													(You will receive)
												</span>
											)}
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

					{/* Members Section */}
					<div className='bg-white rounded-lg shadow-md p-6'>
						<div className='flex justify-between items-center mb-4'>
							<h2 className='text-xl font-semibold'>
								Members ({groupMembers.length})
							</h2>
							{isCreator && (
								<button
									onClick={() => setShowAddMember(true)}
									className='bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition-colors'
								>
									Add Member
								</button>
							)}
						</div>

						<div className='space-y-2'>
							{groupMembers.map((member) => (
								<div
									key={member.id}
									className='flex justify-between items-center p-2 bg-gray-50 rounded'
								>
									<div>
										<span className='font-medium'>
											{member.email}
										</span>
										{member.id === group.created_by && (
											<span
												className='ml-2'
												title='Group Creator'
											>
												<svg
													xmlns='http://www.w3.org/2000/svg'
													className='inline-block w-4 h-4 text-yellow-500'
													fill='currentColor'
													viewBox='0 0 20 20'
												>
													<path d='M2.166 6.5l3.5 7 4.334-8.667L14.334 13.5l3.5-7L20 15.5H0l2.166-9z' />
												</svg>
											</span>
										)}
										{member.id === auth?.user?.id && (
											<span className='text-xs text-blue-600 ml-2'>
												(You)
											</span>
										)}
									</div>
									{isCreator &&
										member.id !== auth?.user?.id && (
											<button
												onClick={() =>
													handleRemoveMember(member)
												}
												className='text-red-500 hover:text-red-700 text-sm'
											>
												Remove
											</button>
										)}
								</div>
							))}
						</div>

						{groupMembers.length === 0 && (
							<p className='text-gray-500 text-center py-4'>
								No members yet
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Add Member Modal */}
			{showAddMember && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-md'>
						<h2 className='text-xl font-semibold mb-4'>
							Add Member to Group
						</h2>

						{/* Display the error here */}
						{addMemberError && (
							<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm'>
								{addMemberError}
							</div>
						)}

						<form onSubmit={handleAddMember}>
							<div className='mb-4'>
								<label className='block text-sm font-medium mb-2'>
									Email Address
								</label>
								<input
									type='email'
									value={newMemberEmail}
									onChange={(e) =>
										setNewMemberEmail(e.target.value)
									}
									className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder="Enter user's email"
									required
								/>
								<p className='text-sm text-gray-600 mt-1'>
									The user must already have an account with
									this email.
								</p>
							</div>
							<div className='flex justify-end space-x-3'>
								<button
									type='button'
									onClick={() => {
										resetMemberForm(); // Reset form data
										setShowAddMember(false); // Close modal
									}}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600'
								>
									Add Member
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Enhanced Add Expense Modal */}
			{showAddExpense && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
					onClick={closeExpenseModal} // Close when clicking backdrop
				>
					<div
						className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'
						onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
					>
						<h2 className='text-xl font-semibold mb-4'>
							Add New Expense
						</h2>
						<form onSubmit={handleAddExpense}>
							<div className='space-y-6'>
								{/* Basic Info */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium mb-2'>
											Description
										</label>
										<input
											type='text'
											value={newExpense.description}
											onChange={(e) =>
												setNewExpense({
													...newExpense,
													description: e.target.value,
												})
											}
											className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='e.g., Dinner, Groceries'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2'>
											Total Amount
										</label>
										<input
											type='number'
											step='0.01'
											value={newExpense.total_amount}
											onChange={(e) =>
												setNewExpense({
													...newExpense,
													total_amount:
														e.target.value,
												})
											}
											className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
											required
										/>
									</div>
								</div>

								{/* Split Mode Selection */}
								<div className='bg-gray-50 p-4 rounded'>
									<h3 className='font-medium mb-3'>
										Split Options
									</h3>
									<div className='flex items-center space-x-4 mb-3'>
										<label className='flex items-center'>
											<input
												type='checkbox'
												checked={autoCalculateShares}
												onChange={(e) =>
													setAutoCalculateShares(
														e.target.checked
													)
												}
												className='mr-2'
											/>
											Auto-calculate shares
										</label>
									</div>

									{autoCalculateShares && (
										<div className='flex space-x-4'>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='equal'
													checked={
														splitMode === 'equal'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Equal split
											</label>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='percentage'
													checked={
														splitMode ===
														'percentage'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Proportional to amount paid
											</label>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='custom'
													checked={
														splitMode === 'custom'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Custom amounts
											</label>
										</div>
									)}
								</div>

								{/* Payers Section */}
								<div>
									<label className='block text-sm font-medium mb-2'>
										Who Paid (Payers)
									</label>
									{newExpense.payers.map((payer, index) => (
										<div
											key={index}
											className='flex space-x-2 mb-2'
										>
											<select
												value={payer.user_id}
												onChange={(e) =>
													updatePayer(
														index,
														'user_id',
														e.target.value
													)
												}
												className='flex-1 p-2 border border-gray-300 rounded'
												required
											>
												<option value=''>
													Select User
												</option>
												{getAvailableUsersForPayer(
													index
												).map((member) => (
													<option
														key={member.id}
														value={member.id}
													>
														{member.email}
													</option>
												))}
											</select>
											<input
												type='number'
												step='0.01'
												placeholder='Amount paid'
												value={payer.paid_amount}
												onChange={(e) =>
													updatePayer(
														index,
														'paid_amount',
														e.target.value
													)
												}
												className='flex-1 p-2 border border-gray-300 rounded'
												required
											/>
											{newExpense.payers.length > 1 && (
												<button
													type='button'
													onClick={() =>
														removePayer(index)
													}
													className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
												>
													×
												</button>
											)}
										</div>
									))}
									<button
										type='button'
										onClick={addPayer}
										className='text-blue-500 text-sm hover:text-blue-700'
									>
										+ Add another payer
									</button>
								</div>

								{/* Shares Section */}
								<div>
									<label className='block text-sm font-medium mb-2'>
										Who Owes (Shares){' '}
										{autoCalculateShares &&
											splitMode !== 'custom' &&
											'(Auto-calculated)'}
									</label>
									{newExpense.shares.map((share, index) => (
										<div
											key={index}
											className='flex space-x-2 mb-2'
										>
											<select
												value={share.user_id}
												onChange={(e) =>
													updateShare(
														index,
														'user_id',
														e.target.value
													)
												}
												className='flex-1 p-2 border border-gray-300 rounded'
												required
												disabled={
													autoCalculateShares &&
													splitMode !== 'custom'
												}
											>
												<option value=''>
													Select User
												</option>
												{getAvailableUsersForShare(
													index
												).map((member) => (
													<option
														key={member.id}
														value={member.id}
													>
														{member.email}
													</option>
												))}
											</select>
											<input
												type='number'
												step='0.01'
												placeholder='Amount owed'
												value={share.share_amount}
												onChange={(e) =>
													updateShare(
														index,
														'share_amount',
														e.target.value
													)
												}
												className='flex-1 p-2 border border-gray-300 rounded'
												required
												disabled={
													autoCalculateShares &&
													splitMode !== 'custom'
												}
											/>
											{newExpense.shares.length > 1 && (
												<button
													type='button'
													onClick={() =>
														removeShare(index)
													}
													className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
												>
													×
												</button>
											)}
										</div>
									))}

									{/* Smart add button */}
									{autoCalculateShares &&
									splitMode !== 'custom' ? (
										<div className='text-sm text-gray-600'>
											💡 Switch to "Custom amounts" mode
											to manually add/remove people who
											owe
										</div>
									) : (
										<button
											type='button'
											onClick={addShare}
											className='text-blue-500 text-sm hover:text-blue-700'
										>
											+ Add another person who owes
										</button>
									)}
								</div>

								{/* Enhanced Validation Summary */}
								<div className='bg-gray-50 p-4 rounded'>
									<h3 className='font-medium mb-3'>
										Validation Summary
									</h3>
									{(() => {
										const {
											totalAmount,
											totalPaid,
											totalShares,
											remainingPaid,
											remainingShares,
										} = calculateRemainingAmount();

										return (
											<div className='space-y-2 text-sm'>
												<div className='grid grid-cols-2 gap-4'>
													<div>
														<span className='font-medium'>
															Total Amount:
														</span>{' '}
														$
														{totalAmount.toFixed(2)}
													</div>
													<div>
														<span className='font-medium'>
															Total Paid:
														</span>
														<span
															className={
																Math.abs(
																	totalPaid -
																		totalAmount
																) < 0.01
																	? 'text-green-600'
																	: 'text-red-600'
															}
														>
															{' '}
															$
															{totalPaid.toFixed(
																2
															)}
														</span>
													</div>
												</div>

												<div className='grid grid-cols-2 gap-4'>
													<div>
														<span className='font-medium'>
															Total Shares:
														</span>
														<span
															className={
																Math.abs(
																	totalShares -
																		totalAmount
																) < 0.01
																	? 'text-green-600'
																	: 'text-red-600'
															}
														>
															{' '}
															$
															{totalShares.toFixed(
																2
															)}
														</span>
													</div>
													<div>
														<span className='font-medium'>
															Remaining:
														</span>
														<span
															className={
																Math.abs(
																	remainingShares
																) < 0.01
																	? 'text-green-600'
																	: 'text-orange-600'
															}
														>
															{' '}
															$
															{remainingShares.toFixed(
																2
															)}
														</span>
													</div>
												</div>

												{/* Show precision info for equal splits */}
												{splitMode === 'equal' &&
													Math.abs(remainingShares) <
														0.01 &&
													remainingShares !== 0 && (
														<div className='bg-blue-100 border border-blue-300 text-blue-700 px-3 py-2 rounded text-xs'>
															ℹ️ Precision
															difference of $
															{Math.abs(
																remainingShares
															).toFixed(2)}{' '}
															automatically
															distributed
														</div>
													)}

												{Math.abs(
													totalPaid - totalAmount
												) < 0.01 &&
													Math.abs(
														totalShares -
															totalAmount
													) < 0.01 && (
														<div className='bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded'>
															✅ All amounts are
															balanced!
														</div>
													)}
											</div>
										);
									})()}
								</div>

								{/* Add helpful hints */}
								<div className='text-sm text-gray-600 mb-2'>
									💡 Custom amounts must add up to the total
									expense amount (${totalAmount.toFixed(2)})
								</div>

								{/* Add real-time feedback */}
								<div
									className={`text-sm ${
										totalShares > totalAmount
											? 'text-red-600'
											: 'text-green-600'
									}`}
								>
									Total shares: ${totalShares.toFixed(2)} / $
									{totalAmount.toFixed(2)}
								</div>

								{/* Add auto-balance button */}
								{Math.abs(totalShares - totalAmount) > 0.01 && (
									<button
										type='button'
										onClick={autoBalanceShares}
										className='text-blue-500 text-sm hover:text-blue-700'
									>
										🔧 Auto-balance remaining amount
									</button>
								)}
							</div>

							<div className='flex justify-end space-x-3 mt-6'>
								<button
									type='button'
									onClick={() => {
										resetExpenseForm(); // Reset form data
										setShowAddExpense(false); // Close modal
									}}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
									disabled={(() => {
										const {
											totalAmount,
											totalPaid,
											totalShares,
										} = calculateRemainingAmount();
										return (
											Math.abs(totalPaid - totalAmount) >
												0.01 ||
											Math.abs(
												totalShares - totalAmount
											) > 0.01
										);
									})()}
								>
									Add Expense
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Expense Modal */}
			{showEditExpense && editingExpense && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
						<h2 className='text-xl font-semibold mb-4'>
							Edit Expense
						</h2>
						<form onSubmit={handleUpdateExpense}>
							<div className='space-y-6'>
								{/* Basic Info */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium mb-2'>
											Description
										</label>
										<input
											type='text'
											value={editingExpense.description}
											onChange={(e) =>
												setEditingExpense({
													...editingExpense,
													description: e.target.value,
												})
											}
											className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
											placeholder='e.g., Dinner, Groceries'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium mb-2'>
											Total Amount
										</label>
										<input
											type='number'
											step='0.01'
											value={editingExpense.total_amount}
											onChange={(e) =>
												setEditingExpense({
													...editingExpense,
													total_amount:
														e.target.value,
												})
											}
											className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
											required
										/>
									</div>
								</div>

								{/* Split Mode Selection */}
								<div className='bg-gray-50 p-4 rounded'>
									<h3 className='font-medium mb-3'>
										Split Options
									</h3>
									<div className='flex items-center space-x-4 mb-3'>
										<label className='flex items-center'>
											<input
												type='checkbox'
												checked={autoCalculateShares}
												onChange={(e) =>
													setAutoCalculateShares(
														e.target.checked
													)
												}
												className='mr-2'
											/>
											Auto-calculate shares
										</label>
									</div>

									{autoCalculateShares && (
										<div className='flex space-x-4'>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='equal'
													checked={
														splitMode === 'equal'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Equal split
											</label>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='percentage'
													checked={
														splitMode ===
														'percentage'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Proportional to amount paid
											</label>
											<label className='flex items-center'>
												<input
													type='radio'
													name='splitMode'
													value='custom'
													checked={
														splitMode === 'custom'
													}
													onChange={(e) =>
														setSplitMode(
															e.target.value
														)
													}
													className='mr-2'
												/>
												Custom amounts
											</label>
										</div>
									)}
								</div>

								{/* Payers Section */}
								<div>
									<label className='block text-sm font-medium mb-2'>
										Who Paid (Payers)
									</label>
									{editingExpense.payers.map(
										(payer, index) => (
											<div
												key={index}
												className='flex space-x-2 mb-2'
											>
												<select
													value={payer.user_id}
													onChange={(e) =>
														setEditingExpense({
															...editingExpense,
															payers: editingExpense.payers.map(
																(p, i) =>
																	i === index
																		? {...p, user_id: e.target.value,} : p),
														})
													}
													className='flex-1 p-2 border border-gray-300 rounded'
													required
												>
													<option value=''>
														Select User
													</option>
													{getAvailableUsersForPayer(
														index
													).map((member) => (
														<option
															key={member.id}
															value={member.id}
														>
															{member.email}
														</option>
													))}
												</select>
												<input
													type='number'
													step='0.01'
													placeholder='Amount paid'
													value={payer.paid_amount}
													onChange={(e) =>
														setEditingExpense({
															...editingExpense,
															payers: editingExpense.payers.map(
																(p, i) =>
																	i === index
																		? {
																				...p,
																				paid_amount:
																					e
																						.target
																						.value,
																		  }
																		: p
															),
														})
													}
													className='flex-1 p-2 border border-gray-300 rounded'
													required
												/>
												{editingExpense.payers.length >
													1 && (
													<button
														type='button'
														onClick={() =>
															setEditingExpense({
																...editingExpense,
																payers: editingExpense.payers.filter(
																	(_, i) =>
																		i !==
																		index
																),
															})
														}
														className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
													>
														×
													</button>
												)}
											</div>
										)
									)}
									<button
										type='button'
										onClick={() =>
											setEditingExpense({
												...editingExpense,
												payers: [
													...editingExpense.payers,
													{
														user_id: '',
														paid_amount: '',
													},
												],
											})
										}
										className='text-blue-500 text-sm hover:text-blue-700'
									>
										+ Add another payer
									</button>
								</div>

								{/* Shares Section */}
								<div>
									<label className='block text-sm font-medium mb-2'>
										Who Owes (Shares){' '}
										{autoCalculateShares &&
											splitMode !== 'custom' &&
											'(Auto-calculated)'}
									</label>
									{editingExpense.shares.map(
										(share, index) => (
											<div
												key={index}
												className='flex space-x-2 mb-2'
											>
												<select
													value={share.user_id}
													onChange={(e) =>
														setEditingExpense({
															...editingExpense,
															shares: editingExpense.shares.map(
																(s, i) =>
																	i === index
																		? {
																				...s,
																				user_id:
																					e
																						.target
																						.value,
																		  }
																		: s
															),
														})
													}
													className='flex-1 p-2 border border-gray-300 rounded'
													required
													disabled={
														autoCalculateShares &&
														splitMode !== 'custom'
													}
												>
													<option value=''>
														Select User
													</option>
													{getAvailableUsersForShare(
														index
													).map((member) => (
														<option
															key={member.id}
															value={member.id}
														>
															{member.email}
														</option>
													))}
												</select>
												<input
													type='number'
													step='0.01'
													placeholder='Amount owed'
													value={share.share_amount}
													onChange={(e) =>
														setEditingExpense({
															...editingExpense,
															shares: editingExpense.shares.map(
																(s, i) =>
																	i === index
																		? {
																				...s,
																				share_amount:
																					e
																						.target
																						.value,
																		  }
																		: s
															),
														})
													}
													className='flex-1 p-2 border border-gray-300 rounded'
													required
													disabled={
														autoCalculateShares &&
														splitMode !== 'custom'
													}
												/>
												{editingExpense.shares.length >
													1 && (
													<button
														type='button'
														onClick={() =>
															setEditingExpense({
																...editingExpense,
																shares: editingExpense.shares.filter(
																	(_, i) =>
																		i !==
																		index
																),
															})
														}
														className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
													>
														×
													</button>
												)}
											</div>
										)
									)}

									{/* Smart add button */}
									{autoCalculateShares &&
									splitMode !== 'custom' ? (
										<div className='text-sm text-gray-600'>
											💡 Switch to "Custom amounts" mode
											to manually add/remove people who
											owe
										</div>
									) : (
										<button
											type='button'
											onClick={() =>
												setEditingExpense({
													...editingExpense,
													shares: [
														...editingExpense.shares,
														{
															user_id: '',
															share_amount: '',
														},
													],
												})
											}
											className='text-blue-500 text-sm hover:text-blue-700'
										>
											+ Add another person who owes
										</button>
									)}
								</div>

								{/* Enhanced Validation Summary */}
								<div className='bg-gray-50 p-4 rounded'>
									<h3 className='font-medium mb-3'>
										Validation Summary
									</h3>
									{(() => {
										const {
											totalAmount,
											totalPaid,
											totalShares,
											remainingPaid,
											remainingShares,
										} = calculateRemainingAmount();

										return (
											<div className='space-y-2 text-sm'>
												<div className='grid grid-cols-2 gap-4'>
													<div>
														<span className='font-medium'>
															Total Amount:
														</span>{' '}
														$
														{totalAmount.toFixed(2)}
													</div>
													<div>
														<span className='font-medium'>
															Total Paid:
														</span>
														<span
															className={
																Math.abs(
																	totalPaid -
																		totalAmount
																) < 0.01
																	? 'text-green-600'
																	: 'text-red-600'
															}
														>
															{' '}
															$
															{totalPaid.toFixed(
																2
															)}
														</span>
													</div>
												</div>

												<div className='grid grid-cols-2 gap-4'>
													<div>
														<span className='font-medium'>
															Total Shares:
														</span>
														<span
															className={
																Math.abs(
																	totalShares -
																		totalAmount
																) < 0.01
																	? 'text-green-600'
																	: 'text-red-600'
															}
														>
															{' '}
															$
															{totalShares.toFixed(
																2
															)}
														</span>
													</div>
													<div>
														<span className='font-medium'>
															Remaining:
														</span>
														<span
															className={
																Math.abs(
																	remainingShares
																) < 0.01
																	? 'text-green-600'
																	: 'text-orange-600'
															}
														>
															{' '}
															$
															{remainingShares.toFixed(
																2
															)}
														</span>
													</div>
												</div>

												{/* Show precision info for equal splits */}
												{splitMode === 'equal' &&
													Math.abs(remainingShares) <
														0.01 &&
													remainingShares !== 0 && (
														<div className='bg-blue-100 border border-blue-300 text-blue-700 px-3 py-2 rounded text-xs'>
															ℹ️ Precision
															difference of $
															{Math.abs(
																remainingShares
															).toFixed(2)}{' '}
															automatically
															distributed
														</div>
													)}

												{Math.abs(
													totalPaid - totalAmount
												) < 0.01 &&
													Math.abs(
														totalShares -
															totalAmount
													) < 0.01 && (
														<div className='bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded'>
															✅ All amounts are
															balanced!
														</div>
													)}
											</div>
										);
									})()}
								</div>

								{/* Add helpful hints */}
								<div className='text-sm text-gray-600 mb-2'>
									💡 Custom amounts must add up to the total
									expense amount (${totalAmount.toFixed(2)})
								</div>

								{/* Add real-time feedback */}
								<div
									className={`text-sm ${
										totalShares > totalAmount
											? 'text-red-600'
											: 'text-green-600'
									}`}
								>
									Total shares: ${totalShares.toFixed(2)} / $
									{totalAmount.toFixed(2)}
								</div>

								{/* Add auto-balance button */}
								{Math.abs(totalShares - totalAmount) > 0.01 && (
									<button
										type='button'
										onClick={autoBalanceShares}
										className='text-blue-500 text-sm hover:text-blue-700'
									>
										🔧 Auto-balance remaining amount
									</button>
								)}
							</div>

							<div className='flex justify-end space-x-3 mt-6'>
								<button
									type='button'
									onClick={() => {
										setShowEditExpense(false);
										setEditingExpense(null);
									}}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
								>
									Update Expense
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
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

			{isCreator && (
				<div className='flex space-x-2 mt-4'>
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
			)}

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

			{/* Remove Member Confirmation Modal */}
			<ConfirmationModal
				isOpen={showRemoveMemberConfirm}
				onClose={() => setShowRemoveMemberConfirm(false)}
				onConfirm={confirmRemoveMember}
				title='Remove Member'
				message={`Are you sure you want to remove ${memberToRemove?.email} from the group?`}
				confirmText='Remove'
				cancelText='Cancel'
				confirmColor='red'
				icon='delete'
				isLoading={isRemovingMember}
				loadingText='Removing...'
			/>
		</div>
	);
};

export default GroupDetails;
