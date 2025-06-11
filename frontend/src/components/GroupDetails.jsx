import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const GroupDetails = () => {
	const { groupId } = useParams();
	const { auth } = useAuth();
	const [group, setGroup] = useState(null);
	const [expenses, setExpenses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAddExpense, setShowAddExpense] = useState(false);
	const [newExpense, setNewExpense] = useState({
		description: '',
		total_amount: '',
		payers: [{ user_id: auth?.user?.id, paid_amount: '' }],
		shares: [{ user_id: auth?.user?.id, share_amount: '' }],
	});

	useEffect(() => {
		fetchGroupDetails();
		fetchGroupExpenses();
	}, [groupId]);

	const fetchGroupDetails = async () => {
		try {
			const response = await apiClient.get(`/api/groups/${groupId}`);
			setGroup(response.data);
		} catch (err) {
			setError('Failed to load group details');
			console.error('Error fetching group:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchGroupExpenses = async () => {
		try {
			const response = await apiClient.get(
				`/api/groups/${groupId}/expenses`
			);
			setExpenses(response.data);
		} catch (err) {
			setError('Failed to load expenses');
			console.error('Error fetching expenses:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleAddExpense = async (e) => {
		e.preventDefault();
		try {
			const expenseData = {
				...newExpense,
				group_id: parseInt(groupId),
				total_amount: parseFloat(newExpense.total_amount),
				payers: newExpense.payers.map((p) => ({
					...p,
					paid_amount: parseFloat(p.paid_amount),
				})),
				shares: newExpense.shares.map((s) => ({
					...s,
					share_amount: parseFloat(s.share_amount),
				})),
			};

			await apiClient.post('/api/expenses', expenseData);
			setShowAddExpense(false);
			setNewExpense({
				description: '',
				total_amount: '',
				payers: [{ user_id: auth?.user?.id, paid_amount: '' }],
				shares: [{ user_id: auth?.user?.id, share_amount: '' }],
			});
			fetchGroupExpenses();
		} catch (err) {
			setError('Failed to add expense');
			console.error('Error adding expense:', err);
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

			{error && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
					{error}
				</div>
			)}

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* Expenses Section */}
				<div className='bg-white rounded-lg shadow-md p-6'>
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
									</div>
									<span className='text-lg font-semibold text-green-600'>
										${expense.total_amount}
									</span>
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
							{new Date(group.created_at).toLocaleDateString()}
						</div>
						<div>
							<span className='font-medium'>Total Expenses:</span>{' '}
							{expenses.length}
						</div>
						<div>
							<span className='font-medium'>Total Amount:</span> $
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
			</div>

			{/* Add Expense Modal */}
			{showAddExpense && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto'>
						<h2 className='text-xl font-semibold mb-4'>
							Add New Expense
						</h2>
						<form onSubmit={handleAddExpense}>
							<div className='space-y-4'>
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
												total_amount: e.target.value,
											})
										}
										className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2'>
										Amount You Paid
									</label>
									<input
										type='number'
										step='0.01'
										value={newExpense.payers[0].paid_amount}
										onChange={(e) =>
											setNewExpense({
												...newExpense,
												payers: [
													{
														...newExpense.payers[0],
														paid_amount:
															e.target.value,
													},
												],
											})
										}
										className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2'>
										Your Share
									</label>
									<input
										type='number'
										step='0.01'
										value={
											newExpense.shares[0].share_amount
										}
										onChange={(e) =>
											setNewExpense({
												...newExpense,
												shares: [
													{
														...newExpense.shares[0],
														share_amount:
															e.target.value,
													},
												],
											})
										}
										className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
										required
									/>
								</div>
							</div>

							<div className='flex justify-end space-x-3 mt-6'>
								<button
									type='button'
									onClick={() => setShowAddExpense(false)}
									className='px-4 py-2 text-gray-600 hover:text-gray-800'
								>
									Cancel
								</button>
								<button
									type='submit'
									className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
								>
									Add Expense
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default GroupDetails;
