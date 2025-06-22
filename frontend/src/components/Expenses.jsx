import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import ConfirmationModal from './ConfirmationModal';
import EditExpenseModal from './EditExpenseModal';

const Expenses = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'group'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
    const [editingExpense, setEditingExpense] = useState(null);
    const [showEditExpense, setShowEditExpense] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
	const [groupMembersForEdit, setGroupMembersForEdit] = useState([]);

    useEffect(() => {
        fetchExpenses();
        fetchGroups();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await apiClient.get('/api/expenses');
            setExpenses(response.data);
        } catch (err) {
            setError('Failed to load expenses');
            toast.error('Failed to load expenses');
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await apiClient.get('/api/groups');
            setGroups(response.data);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    };

    // Filter and sort expenses
    const getFilteredAndSortedExpenses = () => {
        let filtered = expenses;

        // Filter by group
        if (filterGroup !== 'all') {
            filtered = expenses.filter(expense => expense.group_id === parseInt(filterGroup));
        }

        // Sort expenses
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.created_at) - new Date(b.created_at);
                    break;
                case 'amount':
                    comparison = a.total_amount - b.total_amount;
                    break;
                case 'group':
                    const groupA = groups.find(g => g.id === a.group_id)?.name || '';
                    const groupB = groups.find(g => g.id === b.group_id)?.name || '';
                    comparison = groupA.localeCompare(groupB);
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    };

    // Calculate summary statistics
    const calculateStats = () => {
        const filteredExpenses = getFilteredAndSortedExpenses();
        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.total_amount, 0);
        const averageAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
        
        // Group by month for trend analysis
        const monthlyData = filteredExpenses.reduce((acc, expense) => {
            const month = new Date(expense.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[month] = (acc[month] || 0) + expense.total_amount;
            return acc;
        }, {});

        // Find most expensive expense
        const mostExpensive = filteredExpenses.reduce((max, expense) => 
            expense.total_amount > max.total_amount ? expense : max, 
            { total_amount: 0 }
        );

        return {
            totalExpenses: filteredExpenses.length,
            totalAmount,
            averageAmount,
            monthlyData,
            mostExpensive
        };
    };

    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : 'Unknown Group';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Reset all filters
    const resetFilters = () => {
        setFilterGroup('all');
        setSortBy('date');
        setSortOrder('desc');
    };

    const handleEditExpense = async (expenseId) => {
        try {
            setError('');
            const response = await apiClient.get(`/api/expenses/${expenseId}/details`);
            const expenseData = response.data;
            
            const membersResponse = await apiClient.get(`/api/groups/${expenseData.expense.group_id}/members`);
			setGroupMembersForEdit(membersResponse.data.members);

            setEditingExpense({
                id: expenseData.expense.id,
                group_id: expenseData.expense.group_id,
                description: expenseData.expense.description,
                total_amount: expenseData.expense.total_amount.toString(),
                payers: expenseData.payers.map(payer => ({
                    user_id: payer.user_id.toString(),
                    paid_amount: payer.paid_amount.toString()
                })),
                shares: expenseData.shares.map(share => ({
                    user_id: share.user_id.toString(),
                    share_amount: share.share_amount.toString()
                }))
            });
            setShowEditExpense(true);
        } catch (err) {
            setError('Failed to load expense details');
            toast.error('Failed to load expense details');
            console.error('Error loading expense:', err);
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

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateExpense(editingExpense);
        if (validationErrors.length > 0) {
            setError(validationErrors.join('. '));
            toast.error(validationErrors.join('. '));
            return;
        }

        try {
            const expenseData = {
                description: editingExpense.description,
                total_amount: parseFloat(editingExpense.total_amount),
                payers: editingExpense.payers.map(p => ({
                    user_id: parseInt(p.user_id),
                    paid_amount: parseFloat(p.paid_amount)
                })),
                shares: editingExpense.shares.map(s => ({
                    user_id: parseInt(s.user_id),
                    share_amount: parseFloat(s.share_amount)
                }))
            };

            await apiClient.put(`/api/expenses/${editingExpense.id}`, expenseData);
            setShowEditExpense(false);
            setEditingExpense(null);
            setError('');
            setSuccess('Expense updated successfully');
            toast.success('Expense updated successfully');
            fetchExpenses();
        } catch (err) {
            setError('Failed to update expense');
            toast.error('Failed to update expense');
            console.error('Error updating expense:', err);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        setExpenseToDelete(expenseId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteExpense = async () => {
        try {
            await apiClient.delete(`/api/expenses/${expenseToDelete}`);
            setError('');
            setSuccess('Expense deleted successfully');
            toast.success('Expense deleted successfully');
            fetchExpenses();
        } catch (err) {
            setError('Failed to delete expense');
            toast.error('Failed to delete expense');
            console.error('Error deleting expense:', err);
        } finally {
            setShowDeleteConfirm(false);
            setExpenseToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    const filteredExpenses = getFilteredAndSortedExpenses();
    const stats = calculateStats();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Expense Overview</h1>
                <p className="text-gray-600 mt-2">Track and analyze all your expenses across groups</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Average Amount</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.averageAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Highest Expense</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.mostExpensive.total_amount > 0 ? `$${stats.mostExpensive.total_amount.toFixed(2)}` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Group</label>
                            <select
                                value={filterGroup}
                                onChange={(e) => setFilterGroup(e.target.value)}
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Groups</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="date">Date</option>
                                <option value="amount">Amount</option>
                                <option value="group">Group</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="desc">Newest/High to Low</option>
                                <option value="asc">Oldest/Low to High</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(filterGroup !== 'all' || sortBy !== 'date' || sortOrder !== 'desc') && (
                            <div className="flex items-end">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-600">
                        Showing {filteredExpenses.length} of {expenses.length} expenses
                    </div>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            {Object.keys(stats.monthlyData).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
                    <div className="space-y-2">
                        {Object.entries(stats.monthlyData)
                            .sort(([a], [b]) => new Date(a) - new Date(b))
                            .map(([month, amount]) => (
                                <div key={month} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">{month}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ 
                                                    width: `${(amount / Math.max(...Object.values(stats.monthlyData))) * 100}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">${amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Enhanced Expenses List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Expense Details</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <h3 className="font-medium text-gray-900">
                                            {expense.description || 'No description'}
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {getGroupName(expense.group_id)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formatDate(expense.created_at)}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        <span>Group ID: {expense.group_id}</span>
                                        <span>Expense ID: {expense.id}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg font-semibold text-green-600">
                                            ${expense.total_amount.toFixed(2)}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditExpense(expense.id)}
                                                className="p-1 text-blue-500 hover:text-blue-700"
                                                title="Edit expense"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                                title="Delete expense"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <button
                                            onClick={() => navigate(`/groups/${expense.group_id}`)}
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            View Group →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredExpenses.length === 0 && (
                    <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">No expenses found</p>
                        {filterGroup !== 'all' && (
                            <button
                                onClick={() => setFilterGroup('all')}
                                className="mt-2 text-blue-500 hover:text-blue-700"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            <EditExpenseModal
                isOpen={showEditExpense}
                onClose={() => {
                    setShowEditExpense(false);
                    setEditingExpense(null);
                    setError('');
                }}
                onUpdate={handleUpdateExpense}
                expense={editingExpense}
                setExpense={setEditingExpense}
                groupMembers={groupMembersForEdit}
                error={error}
                title="Edit Expense"
                submitText="Update Expense"
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setExpenseToDelete(null);
                }}
                onConfirm={confirmDeleteExpense}
                title="Delete Expense"
                message="Are you sure you want to delete this expense? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="red"
                icon="delete"
            />
        </div>
    );
};

export default Expenses;