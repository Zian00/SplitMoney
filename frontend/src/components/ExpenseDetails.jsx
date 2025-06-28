import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import { toast } from 'react-toastify';
import EditExpenseModal from './EditExpenseModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faArrowLeft, faCalendarAlt, faDollarSign, faChartPie } from '@fortawesome/free-solid-svg-icons';

const getInitial = (nameOrEmail) => {
	if (!nameOrEmail) return '?';
	return nameOrEmail.trim()[0].toUpperCase();
};

const ExpenseDetail = () => {
	const { expenseId } = useParams();
	const { auth } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [expense, setExpense] = useState(null);
	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showEditExpense, setShowEditExpense] = useState(false);
	const [editingExpense, setEditingExpense] = useState(null);
	const [editModalConfig, setEditModalConfig] = useState({});

	// Get the previous page from location state or default to expenses
	const getBackPath = () => {
		// Check if we have a 'from' parameter in the URL
		const urlParams = new URLSearchParams(location.search);
		const fromParam = urlParams.get('from');
		
		if (fromParam) {
			return fromParam;
		}
		
		// Check if we have state from navigation
		if (location.state?.from) {
			return location.state.from;
		}
		
		// Default fallback
		return '/expenses';
	};

	const handleBack = () => {
		const backPath = getBackPath();
		navigate(backPath);
	};

	useEffect(() => {
		const fetchExpense = async () => {
			try {
				const res = await apiClient.get(
					`/api/expenses/${expenseId}/details`
				);
				setExpense(res.data);

				// Fetch group members for name lookup
				const groupId = res.data.expense.group_id;
				const membersRes = await apiClient.get(
					`/api/groups/${groupId}/members`
				);
				setMembers(membersRes.data.members);
			} catch (err) {
				navigate('/expenses');
			} finally {
				setLoading(false);
			}
		};
		fetchExpense();
	}, [expenseId, navigate]);

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600 text-lg'>Loading expense details...</p>
				</div>
			</div>
		);
	}

	if (!expense) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='text-center'>
					<div className='text-6xl mb-4'>💸</div>
					<p className='text-gray-600 text-lg'>Expense not found</p>
					<button 
						onClick={handleBack}
						className='mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	// Helper to get user info
	const getUser = (userId) => members.find((m) => m.id === userId);

	// Handler for edit
	const handleEdit = () => {
		const isSettlement = expense.expense.type === "settlement";
		const payerId = expense.payers[0]?.user_id;
		const shareId = expense.shares[0]?.user_id;
		setEditingExpense({
			id: expense.expense.id,
			group_id: expense.expense.group_id,
			description: expense.expense.description,
			total_amount: expense.expense.total_amount.toString(),
			payers: expense.payers.map((payer) => ({
				user_id: payer.user_id.toString(),
				paid_amount: payer.paid_amount.toString(),
			})),
			shares: expense.shares.map((share) => ({
				user_id: share.user_id.toString(),
				share_amount: share.share_amount.toString(),
			})),
		});
		setEditModalConfig(isSettlement
			? {
				readOnlyDescription: true,
				allowedPayerIds: [payerId],
				allowedShareIds: [shareId],
			}
			: {}
		);
		setShowEditExpense(true);
	};

	// Handler for updating the expense
	const handleUpdateExpense = async (e) => {
		e.preventDefault();
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
			// Refresh the expense details
			setLoading(true);
			const res = await apiClient.get(
				`/api/expenses/${expenseId}/details`
			);
			setExpense(res.data);
			toast.success('Expense updated successfully');
		} catch (err) {
			toast.error('Failed to update expense');
		} finally {
			setLoading(false);
		}
	};

	// Handler for delete
	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await apiClient.delete(`/api/expenses/${expense.expense.id}`);
			setShowDeleteConfirm(false);
			navigate('/expenses');
			toast.success('Expense deleted successfully');
		} catch (err) {
			toast.error('Failed to delete expense');
			setShowDeleteConfirm(false);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>

			{/* Header */}
			<div className='bg-white shadow-sm border-b border-gray-200'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						<button
							onClick={handleBack}
							className='flex items-center text-gray-600 hover:text-gray-900 transition-colors'
						>
							<FontAwesomeIcon icon={faArrowLeft} className='mr-2' />
						</button>
						<h1 className='text-lg font-semibold text-gray-900'>Expense Details</h1>
						<div className='w-20'></div> {/* Spacer for centering */}
					</div>
				</div>
			</div>

			<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32'>
				{/* Main Content Grid */}
				<div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
					{/* Left Column - Main Info */}
					<div className='lg:col-span-3 space-y-6'>
						{/* Expense Overview Card */}
						<div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
							<div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white text-center'>
								<div className='mb-2'>
									<FontAwesomeIcon icon={faDollarSign} className='text-3xl opacity-80' />
								</div>
								<h2 className='text-2xl sm:text-3xl font-bold mb-2'>
									{expense.expense.description || 'No description'}
								</h2>
								<div className='text-4xl sm:text-5xl font-bold mb-4'>
									${expense.expense.total_amount.toFixed(2)}
								</div>
								<div className='flex items-center justify-center text-blue-100 text-sm'>
									<FontAwesomeIcon icon={faCalendarAlt} className='mr-2' />
									<span>
										Created {new Date(expense.expense.created_at).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>
							</div>
						</div>

						{/* Paid By Section */}
						<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
							<div className='flex items-center mb-6'>
								<div className='bg-green-100 p-2 rounded-lg mr-3'>
									<FontAwesomeIcon icon={faDollarSign} className='text-green-600' />
								</div>
								<div>
									<h3 className='text-lg font-semibold text-gray-900'>Paid by</h3>
									<p className='text-sm text-gray-500'>{expense.payers.length} payer{expense.payers.length !== 1 ? 's' : ''}</p>
								</div>
							</div>
							<div className='space-y-4'>
								{expense.payers.map((payer) => {
									const user = getUser(payer.user_id);
									const isYou = payer.user_id === auth.user.id;
									const name = isYou
										? 'You'
										: user?.name || user?.email || payer.user_id;

									return (
										<div
											key={payer.user_id}
											className='flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'
										>
											<div className='flex items-center'>
												<div
													className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 shadow-sm
													${isYou ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'}`}
												>
													{getInitial(name)}
												</div>
												<div>
													<div className={`font-semibold text-lg ${isYou ? 'text-blue-700' : 'text-gray-900'}`}>
														{name}
													</div>
													<div className='text-sm text-gray-500'>
														{isYou ? 'You paid' : 'Paid'}
													</div>
												</div>
											</div>
											<div className='text-right'>
												<div className='text-xl font-bold text-green-600'>
													${payer.paid_amount.toFixed(2)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Right Column - Split Details */}
					<div className='lg:col-span-2 lg:max-w-md w-full'>
						<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-6'>
							<div className='flex items-center mb-4 sm:mb-6'>
								<div className='bg-purple-100 p-2 rounded-lg mr-3 flex-shrink-0'>
									<FontAwesomeIcon icon={faChartPie} className='text-purple-600' />
								</div>
								<div className='min-w-0'>
									<h3 className='text-lg font-semibold text-gray-900'>Split Details</h3>
									<p className='text-sm text-gray-500'>{expense.shares.length} people</p>
								</div>
							</div>
							<div className='space-y-3'>
								{expense.shares.map((share) => {
									const user = getUser(share.user_id);
									const isYou = share.user_id === auth.user.id;
									const name = isYou
										? 'You'
										: user?.name || user?.email || share.user_id;
									const percent = (
										(share.share_amount / expense.expense.total_amount) * 100
									).toFixed(1);

									return (
										<div
											key={share.user_id}
											className='flex items-center justify-between p-3 bg-gray-50 rounded-lg min-w-0'
										>
											<div className='flex items-center min-w-0 flex-1 mr-3'>
												<div
													className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0
													${isYou ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'}`}
												>
													{getInitial(name)}
												</div>
												<div className='min-w-0 flex-1'>
													<div className={`font-medium text-sm sm:text-base truncate ${isYou ? 'text-blue-700' : 'text-gray-900'}`}>
														{name}
													</div>
													<div className='text-xs text-gray-500'>
														{percent}% of total
													</div>
												</div>
											</div>
											<div className='text-right flex-shrink-0'>
												<div className='font-bold text-gray-900 text-sm sm:text-base'>
													${share.share_amount.toFixed(2)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Fixed Action Buttons */}
			<div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
					<div className='flex flex-col sm:flex-row gap-3'>
						<button
							onClick={handleEdit}
							className='flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
						>
							<FontAwesomeIcon icon={faPen} />
							<span>Edit Expense</span>
						</button>
						<button
							onClick={() => setShowDeleteConfirm(true)}
							className='flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
						>
							<FontAwesomeIcon icon={faTrash} />
							<span>Delete Expense</span>
						</button>
					</div>
				</div>
			</div>

			{/* Edit Expense Modal */}
			<EditExpenseModal
				isOpen={showEditExpense}
				onClose={() => {
					setShowEditExpense(false);
					setEditingExpense(null);
					setEditModalConfig({});
				}}
				onUpdate={handleUpdateExpense}
				expense={editingExpense}
				setExpense={setEditingExpense}
				groupMembers={members}
				title='Edit Expense'
				submitText='Update Expense'
				{...editModalConfig}
			/>

			{/* Confirmation Modal for Delete */}
			<ConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title='Delete Expense'
				message='Are you sure you want to delete this expense? This action cannot be undone.'
				confirmText='Delete'
				cancelText='Cancel'
				confirmColor='red'
				icon='delete'
				isLoading={isDeleting}
				loadingText='Deleting...'
			/>
		</div>
	);
};

export default ExpenseDetail;