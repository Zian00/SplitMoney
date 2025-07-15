import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import ConfirmationModal from './ConfirmationModal';
import EditExpenseModal from './EditExpenseModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Spinner from './Spinner'

const GroupDetails = () => {
	const { groupId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { auth } = useAuth();

	const [group, setGroup] = useState(null);
	const [groupLoading, setGroupLoading] = useState(true);

	const [expenses, setExpenses] = useState([]);
	const [expensesLoading, setExpensesLoading] = useState(true);

	const [groupMembers, setGroupMembers] = useState([]);
	const [membersLoading, setMembersLoading] = useState(true);

	const [summary, setSummary] = useState([]);
	const [summaryLoading, setSummaryLoading] = useState(true);

	const [showAddExpense, setShowAddExpense] = useState(false);
	const [newExpense, setNewExpense] = useState({
		description: '',
		total_amount: '',
		payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
		shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
	});
	const [editGroupMode, setEditGroupMode] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState(null);
	const [isRemovingMember, setIsRemovingMember] = useState(false);
	const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);

	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteLoading, setInviteLoading] = useState(false);
	const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
	const [isDeletingGroup, setIsDeletingGroup] = useState(false);
	const [showSettleUpModal, setShowSettleUpModal] = useState(false);
	const [debtToSettle, setDebtToSettle] = useState(null);
	const [isSettlingUp, setIsSettlingUp] = useState(false);

	const isCreator = group && group.created_by === auth.user.id;

	useEffect(() => {
		fetchGroupDetails();
		fetchGroupExpenses();
		fetchGroupMembers();
		fetchSummary();
	}, [groupId]);

	const fetchGroupDetails = async () => {
		setGroupLoading(true);
		try {
			const response = await apiClient.get(`/api/groups/${groupId}`);
			setGroup(response.data);
		} catch (err) {
			console.error('Error fetching group:', err);
			setGroup(null);
			toast.error('Failed to load group details');
			setTimeout(() => navigate('/groups'), 2000);
		} finally {
			setGroupLoading(false);
		}
	};

	const fetchGroupExpenses = async () => {
		setExpensesLoading(true);
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
			const sortedExpenses = [...detailedExpenses].sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at)
			);
			setExpenses(sortedExpenses);
		} catch (err) {
			toast.error('Failed to load expenses');
			console.error('Error fetching expenses:', err);
		} finally {
			setExpensesLoading(false);
		}
	};

	const fetchGroupMembers = async () => {
		setMembersLoading(true);
		try {
			const response = await apiClient.get(
				`/api/groups/${groupId}/members`
			);
			setGroupMembers(response.data.members);
		} catch (err) {
			console.error('Error fetching group members:', err);
		} finally {
			setMembersLoading(false);
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
			fetchGroupMembers();
			fetchSummary();
		} catch (err) {
			toast.error('Failed to remove member');
			console.error('Error removing member:', err);
		} finally {
			setIsRemovingMember(false);
			setShowRemoveMemberConfirm(false);
			setMemberToRemove(null);
		}
	};

	const handleAddExpense = async (e) => {
		e.preventDefault();
		setIsExpenseSubmitting(true);
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
			fetchSummary();
		} catch (err) {
			toast.error('Failed to add expense');
			console.error('Error adding expense:', err);
		} finally {
			setIsExpenseSubmitting(false);
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

	const handleDeleteGroup = () => {
		setShowDeleteGroupConfirm(true);
	};

	const confirmDeleteGroup = async () => {
		setIsDeletingGroup(true);
		try {
			await apiClient.delete(`/api/groups/${groupId}`);
			navigate('/groups');
			toast.success('Group deleted successfully');
		} catch (err) {
			toast.error('Failed to delete group');
		} finally {
			setIsDeletingGroup(false);
			setShowDeleteGroupConfirm(false);
		}
	};

	const handleSendInvite = async (e) => {
		e.preventDefault();
		setInviteLoading(true);
		try {
			await apiClient.post(`/api/groups/${groupId}/invite`, { email: inviteEmail });
			toast.success('Invitation sent!');
			setInviteEmail('');
		} catch (err) {
			const errDetail = err.response;
			console.log(errDetail);
			
			toast.error(err.response?.data?.detail || 'Failed to send invite');
		} finally {
			setInviteLoading(false);
		}
	};

	const handleSettleUp = (debt) => {
		setDebtToSettle(debt);
		setShowSettleUpModal(true);
	};

	const confirmSettleUp = async () => {
		if (!debtToSettle) return;
		setIsSettlingUp(true);
		try {
			await apiClient.post(`/api/groups/${groupId}/settle`, {
				to_user_id: debtToSettle.to_user.id,
				amount: debtToSettle.amount
			});
			toast.success('Settlement recorded!');
			fetchSummary();
			fetchGroupExpenses();
			setShowSettleUpModal(false);
			setDebtToSettle(null);
		} catch (err) {
			toast.error('Failed to settle up');
		} finally {
			setIsSettlingUp(false);
		}
	};

	if (groupLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
				<div className="text-center">
					<Spinner size={64} />
					<div className="text-lg font-semibold text-gray-700 mt-4">Loading group details...</div>
					<div className="text-sm text-gray-500 mt-1">Please wait</div>
				</div>
			</div>
		);
	}

	if (!group) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4'>
				<div className='text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full'>
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h1 className='text-2xl font-bold text-gray-900 mb-2'>
						Group not found
					</h1>
					<p className="text-gray-600 mb-6">The group you're looking for doesn't exist or you don't have access to it.</p>
					<button 
						onClick={() => navigate('/groups')}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Back to Groups
					</button>
				</div>
			</div>
		);
	}

	const sortedExpenses = [...expenses].sort(
		(a, b) => new Date(b.created_at) - new Date(a.created_at)
	);

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
			{/* Group Info/Header */}
			{groupLoading ? (
				<div className="flex justify-center items-center py-12"><Spinner /></div>
			) : group ? (
				<div className="bg-white shadow-sm border-b">
					<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-3">
								<button 
									onClick={() => navigate('/groups')}
									className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
								>
									<FontAwesomeIcon icon={faArrowLeft} className='mr-2' />
								</button>
								
								<div>
									<h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
										{group.name}
									</h1>
									<p className='text-gray-500 text-sm mt-1'>
										Created {new Date(group.created_at).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</p>
								</div>
							</div>
							<button
								onClick={() => setShowAddExpense(true)}
								className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 self-start sm:self-auto'
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Add Expense
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex justify-center items-center py-12">
					<div className="text-red-500">Group not found.</div>
				</div>
			)}

			<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				<div className='grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8'>
					{/* Expenses Section */}
					<div className='xl:col-span-2 space-y-6'>
						<div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
							<div className='p-6 border-b border-gray-100'>
								<div className='flex items-center justify-between'>
									<h2 className='text-xl font-semibold text-gray-900'>Recent Expenses</h2>
									<span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
										{expenses.filter(e => e.type !== 'settlement').length} {expenses.filter(e => e.type !== 'settlement').length === 1 ? 'expense' : 'expenses'}
									</span>
								</div>
							</div>

							<div className='divide-y divide-gray-100 max-h-[600px] overflow-y-auto'>

							{expensesLoading ? (
								<div className="flex justify-center items-center py-12"><Spinner /></div>
							) : sortedExpenses.length > 0 ? sortedExpenses.map((expense) => {
								const userPaid = expense.payers
									.filter(p => Number(p.user_id) === auth.user.id)
									.reduce((sum, p) => sum + Number(p.paid_amount), 0);

								const userOwes = expense.shares
									.filter(s => Number(s.user_id) === auth.user.id)
									.reduce((sum, s) => sum + Number(s.share_amount), 0);

								const net = userPaid - userOwes;
								let userStatus, userStatusColor, userStatusBg;
								if (userPaid === 0 && userOwes === 0) {
									userStatus = "Not involved";
									userStatusColor = "text-gray-500";
									userStatusBg = "bg-gray-50";
								} else if (net > 0.01) {
									userStatus = `You lent $${net.toFixed(2)}`;
									userStatusColor = "text-emerald-700";
									userStatusBg = "bg-emerald-50";
								} else if (net < -0.01) {
									userStatus = `You owe $${Math.abs(net).toFixed(2)}`;
									userStatusColor = "text-red-700";
									userStatusBg = "bg-red-50";
								} else {
									userStatus = "You're settled";
									userStatusColor = "text-gray-700";
									userStatusBg = "bg-gray-50";
								}

								return (
									<div 
										key={expense.id} 
										className="p-3 sm:p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 group"
										onClick={() => navigate(`/expenses/${expense.id}?from=${encodeURIComponent(location.pathname)}`)}
									>
										{expense.type === "settlement" ? (
											<div className="flex items-center gap-3">
												{/* Settlement Content */}
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2">
														<div className="flex-1 min-w-0">
															<h3 className="text-sm sm:text-lg font-semibold text-green-700 mb-1 flex items-center gap-2">
																Settlement
															</h3>
															<p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
																<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
																</svg>
																{new Date(expense.created_at).toLocaleDateString('en-US', {
																	year: 'numeric',
																	month: 'short',
																	day: 'numeric',
																	hour: '2-digit',
																	minute: '2-digit'
																})}
															</p>
															{expense.payers.length > 0 && expense.shares.length > 0 && (
																<div className="text-xs sm:text-sm text-green-800">
																	{(() => {
																		const payer = groupMembers.find(u => u.id === expense.payers[0].user_id);
																		const receiver = groupMembers.find(u => u.id === expense.shares[0].user_id);
																		return (
																			<>
																				<strong>{payer ? (payer.id === auth.user.id ? 'You' : payer.name) : 'Someone'}</strong>
																				{' paid '}
																				<strong>{receiver ? (receiver.id === auth.user.id ? 'you' : receiver.name) : 'someone'}</strong>
																				{' to settle up'}
																			</>
																		);
																	})()}
																</div>
															)}
														</div>
														{/* Settlement Amount */}
														<div className="text-right flex-shrink-0">
															<div className="text-lg sm:text-2xl font-bold text-green-700">
																${expense.total_amount.toFixed(2)}
															</div>
														</div>
													</div>
												</div>
											</div>
										) : (
											
											<div className="flex items-center gap-3">
												{/* Left content */}
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between mb-2 gap-2">
														<div className="flex-1 min-w-0">
															<h3 className='text-sm sm:text-lg font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors'>
																{expense.type === "settlement"
																	? "Settlement"
																	: expense.description || 'Untitled expense'}
															</h3>
															<p className='text-xs text-gray-500 flex items-center gap-1'>
																<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
																</svg>
																{new Date(expense.created_at).toLocaleDateString('en-US', {
																	year: 'numeric',
																	month: 'short',
																	day: 'numeric'
																})}
															</p>
														</div>
														
														<div className="text-right flex-shrink-0">
															<div className="text-lg sm:text-2xl font-bold text-gray-600">
																${expense.total_amount.toFixed(2)}
															</div>
														</div>
													</div>

													{/* Status badge */}
													<div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${userStatusBg} ${userStatusColor} mb-2`}>
														{userStatus}
													</div>

													{/* Payers info */}
													<div className="space-y-1">
														<div className="text-xs text-gray-600">
															<span className="font-medium text-gray-800">Paid by:</span>
														</div>
														{expense.payers && expense.payers.length > 0 ? (
															<div className="flex flex-wrap gap-1">
																{expense.payers.map((payer) => {
																	const user = groupMembers.find(u => u.id === payer.user_id);
																	return (
																		<span 
																			key={payer.user_id}
																			className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border"
																		>
																			{user ? (user.id === auth.user.id ? 'You' : user.name) : 'Unknown'} • ${payer.paid_amount.toFixed(2)}
																		</span>
																	);
																})}
															</div>
														) : (
															<span className="text-gray-400 text-xs">No payer information</span>
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								);
							}): (
									<div className='p-12 text-center'>
										<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
											<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
											</svg>
										</div>
										<h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
										<p className='text-gray-500 mb-6'>Start by adding your first group expense</p>
										<button
											onClick={() => setShowAddExpense(true)}
											className='bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium'
										>
											Add First Expense
										</button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Quick Stats */}
						<div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
							<h2 className='text-lg font-semibold text-gray-900 mb-4'>Quick Stats</h2>
							{expensesLoading ? (
								<div className="flex justify-center items-center py-4"><Spinner /></div>
							) : (
								<div className='grid grid-cols-2 gap-4'>
									<div className="text-center p-4 bg-blue-50 rounded-xl">
										<div className="text-2xl font-bold text-blue-600">
											{expenses.filter(e => e.type !== 'settlement').length}
										</div>
										<div className="text-sm text-blue-700">
											{expenses.filter(e => e.type !== 'settlement').length === 1 ? 'Expense' : 'Expenses'}
										</div>
									</div>
									<div className="text-center p-4 bg-purple-50 rounded-xl">
										<div className="text-2xl font-bold text-purple-600">
											${expenses.filter(e => e.type !== 'settlement').reduce((sum, expense) => sum + expense.total_amount, 0).toFixed(2)}
										</div>
										<div className="text-sm text-purple-700">Total</div>
									</div>
								</div>
							)}
						</div>

						{/* Summary Card */}
						<div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
							<h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
								<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
								Balance Summary
							</h2>
							{summaryLoading ? (
								<div className="flex items-center justify-center py-8">
									<Spinner size={32} />
									<span className="ml-3 text-gray-600">Calculating...</span>
								</div>
							) : summary.length > 0 ? (
								<div className='space-y-3'>
									{summary.map((debt, index) => {
										const isYouOwe = debt.from_user.id === auth.user.id;
										const isYouReceive = debt.to_user.id === auth.user.id;
										
										return (
											<div key={index} className={`p-4 rounded-xl border-l-4 ${isYouOwe ? 'bg-red-50 border-red-400' : isYouReceive ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-400'}`}>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<div className="text-sm font-medium text-gray-900">
															{isYouOwe ? (
																<span className="text-red-700">You owe</span>
															) : (
																<span className="font-semibold">{debt.from_user.name}</span>
															)}
															{' owes '}
															{isYouReceive ? (
																<span className="text-green-700">you</span>  
															) : (
																<span className="font-semibold">{debt.to_user.name}</span>
															)}
														</div>
													</div>
													<div className="text-lg font-bold text-gray-900">
														${debt.amount.toFixed(2)}
													</div>
												</div>
												{isYouOwe && (
													<button
														className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
														onClick={() => handleSettleUp(debt)}
													>
														Settle Up
													</button>
												)}
											</div>
										);
									})}
								</div>
							) : (
								<div className='text-center py-8'>
									<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
										<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<p className='text-green-700 font-medium'>All settled up!</p>
									<p className='text-gray-500 text-sm mt-1'>Everyone's balances are even</p>
								</div>
							)}
						</div>

						{/* Members Card */}
						<div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
							<h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
								<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
								Members ({groupMembers.length})
							</h2>

							{membersLoading ? (
								<div className="flex justify-center items-center py-8"><Spinner /></div>
							) : (
								<>
									{isCreator && (
										<form onSubmit={handleSendInvite} className='mb-6 space-y-3'>
											<div className="flex gap-2">
												<input
													type='email'
													value={inviteEmail}
													onChange={e => setInviteEmail(e.target.value)}
													placeholder="Enter email to invite"
													className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
													required
													disabled={inviteLoading}
												/>
												<button
													type='submit'
													className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex-shrink-0'
													disabled={inviteLoading || !inviteEmail}
												>
													{inviteLoading ? (
														<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
													) : (
														'Invite'
													)}
												</button>
											</div>
										</form>
									)}

									<div className='space-y-2'>
										{groupMembers.map((member) => (
											<div key={member.id} className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors'>
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
														{member.name.charAt(0).toUpperCase()}
													</div>
													<div>
														<div className='font-medium text-gray-900 flex items-center gap-2'>
															{member.name}
															{member.id === auth.user.id && (
																<span className='text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
																	You
																</span>
															)}
														</div>
														<div className='text-xs text-gray-500'>{member.email}</div>
													</div>
												</div>
												<div className='flex items-center gap-2'>
													{member.id === group.created_by && (
														<span className='text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full'>
															Creator
														</span>
													)}
													{isCreator && member.id !== auth.user.id && (
														<button
															onClick={() => handleRemoveMember(member)}
															className='text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50 transition-colors'
															title='Remove member'
														>
															<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								</>
							)}
						</div>

						{/* Admin Actions for Creator */}
						{isCreator && (
							<div className='bg-white rounded-2xl shadow-sm border border-red-200 p-6'>
								<h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
									<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									Admin Actions
								</h2>
								<div className='space-y-3'>
									<button
										onClick={handleEditGroup}
										className='w-full bg-amber-500 text-white py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center justify-center gap-2'
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Edit Group Name
									</button>
									<button
										onClick={handleDeleteGroup}
										className='w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2'
										disabled={isDeletingGroup}
									>
										{isDeletingGroup ? (
											<>
												<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Deleting...
											</>
										) : (
											<>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												Delete Group
											</>
										)}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Add new expense Modal */}
			<EditExpenseModal
				isOpen={showAddExpense}
				onClose={() => {
					setShowAddExpense(false);
					setNewExpense({
						description: '',
						total_amount: '',
						payers: [{ user_id: auth?.user?.id || '', paid_amount: '' }],
						shares: [{ user_id: auth?.user?.id || '', share_amount: '' }],
					});
				}}
				onUpdate={handleAddExpense}
				expense={newExpense}
				setExpense={setNewExpense}
				groupMembers={groupMembers}
				title='Add New Expense'
				submitText='Add Expense'
				isSubmitting={isExpenseSubmitting}
			/>

			{/* Edit Group Modal */}
			{editGroupMode && (
			<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200'>
				<div className='bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto transform transition-all animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-hidden'>
					{/* Header */}
					<div className="relative p-6 border-b border-gray-100/80 bg-gradient-to-r from-blue-50 to-indigo-50">
						<h2 className='text-xl font-semibold text-gray-900 flex items-center gap-3'>
							<div className="p-2 bg-blue-100 rounded-xl">
								<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							Edit Group Name
						</h2>
						<p className="text-sm text-gray-600 mt-1">Update your group name to better reflect its purpose</p>
					</div>

					{/* Form Content */}
					<form onSubmit={handleEditGroupSubmit} className="p-6 space-y-6">
						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-700'>
								New Group Name
							</label>
							<div className="relative">
								<input
									type='text'
									value={newGroupName}
									onChange={(e) => setNewGroupName(e.target.value)}
									className='w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300'
									required
									placeholder="Enter a descriptive group name"
									autoFocus
								/>
								<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
									<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								</div>
							</div>
							<p className="text-xs text-gray-500">Choose a name that helps you and others identify this group easily</p>
						</div>

						{/* Action Buttons */}
						<div className='flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2'>
							<button
								type='button'
								onClick={() => setEditGroupMode(false)}
								className='w-full sm:w-auto px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 rounded-xl hover:bg-gray-50 active:bg-gray-100'
							>
								Cancel
							</button>
							<button
								type='submit'
								className='w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] transform'
							>
								Save Changes
							</button>
						</div>
					</form>
				</div>
			</div>
		)}

			{/* Confirmation Modal for removing member in group */}
			<ConfirmationModal
				isOpen={showRemoveMemberConfirm}
				onClose={() => setShowRemoveMemberConfirm(false)}
				onConfirm={confirmRemoveMember}
				title="Remove Member"
				message={
					<>Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from the group?</>
				}
				confirmText="Remove"
				cancelText="Cancel"
				confirmColor="red"
				icon="delete"
				isLoading={isRemovingMember}
				loadingText="Removing..."
			/>

			{/* Confirmation Modal for Group Delete */}
			<ConfirmationModal
				isOpen={showDeleteGroupConfirm}
				onClose={() => setShowDeleteGroupConfirm(false)}
				onConfirm={confirmDeleteGroup}
				title="Delete Group"
				message="Are you sure you want to delete this group? This action cannot be undone and will remove all associated expenses."
				confirmText="Delete"
				cancelText="Cancel"
				confirmColor="red"
				icon="delete"
				isLoading={isDeletingGroup}
				loadingText="Deleting..."
			/>

			{/* Confirmation Modal for settle up */}
			<ConfirmationModal
				isOpen={showSettleUpModal}
				onClose={() => {
					setShowSettleUpModal(false);
					setDebtToSettle(null);
				}}
				onConfirm={confirmSettleUp}
				title="Settle Up"
				message={
					debtToSettle && (
						<>
							Are you sure you want to settle up with <strong>{debtToSettle.to_user.name}</strong> for <strong>${debtToSettle.amount.toFixed(2)}</strong>?
						</>
					)
				}
				confirmText="Settle Up"
				cancelText="Cancel"
				confirmColor="blue"
				icon="info"
				isLoading={isSettlingUp}
				loadingText="Settling..."
			/>
		</div>
	);
};

export default GroupDetails;