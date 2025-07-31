import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import Spinner from './Spinner';


const Expenses = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expenses, setExpenses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterGroup, setFilterGroup] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    const userId = auth.user.id;

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

    const getFilteredAndSortedExpenses = () => {
        let filtered = expenses.filter(exp => exp.type !== 'settlement');

        if (filterGroup !== 'all') {
            filtered = filtered.filter(expense => expense.group_id === parseInt(filterGroup));
        }

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

    const resetFilters = () => {
        setFilterGroup('all');
        setSortBy('date');
        setSortOrder('desc');
        setShowFilters(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Spinner size={64} />
                    <div className="mt-6 text-lg font-medium text-gray-700">
                        Loading expenses...
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Please wait a moment</div>
                </div>
            </div>
        );
    }

    const filteredExpenses = getFilteredAndSortedExpenses();
    console.log(expenses);
    // Only include expenses where the user is a payer or owes a share AND not a settlement
    const involvedExpenses = expenses.filter(exp =>
        exp.type !== "settlement" &&
        (
            (exp.payers && exp.payers.some(p => String(p.user_id) === String(userId))) ||
            (exp.shares && exp.shares.some(s => String(s.user_id) === String(userId)))
        )
    );
    // console.log(involvedExpenses);
    // Calculate the user's total amount involved (paid + owed) per expense
    const userAmounts = involvedExpenses.map(exp => {
        const paid = exp.payers
            .filter(p => String(p.user_id) === String(userId))
            .reduce((sum, p) => sum + p.paid_amount, 0);
        const owed = exp.shares
            .filter(s => String(s.user_id) === String(userId))
            .reduce((sum, sObj) => sum + sObj.share_amount, 0);
        return { expense: exp, total: paid + owed, paid, owed };
    });

    // Total expenses count (user involved)
    const totalExpenses = involvedExpenses.length;

    // Total amount (user involved)
    const totalAmount = userAmounts.reduce((sum, ua) => sum + ua.total, 0);

    // Average amount (user involved)
    const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    // Highest single-transaction amount (user involved)
    const highest = userAmounts.reduce(
        (max, ua) => (ua.total > max.total ? ua : max),
        { total: 0, expense: null, paid: 0, owed: 0 }
    );

    // User-centric monthly trend data
    const monthlyData = involvedExpenses.reduce((acc, exp) => {
        const paid = exp.payers
            .filter(p => String(p.user_id) === String(userId))
            .reduce((sum, p) => sum + p.paid_amount, 0);
        const owed = exp.shares
            .filter(s => String(s.user_id) === String(userId))
            .reduce((sum, sObj) => sum + sObj.share_amount, 0);
        const userTotal = paid + owed;
        const month = new Date(exp.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + userTotal;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Expense Overview
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Track and analyze all your expenses across groups
                            </p>
                        </div>
                        
                        {/* Mobile Filter Toggle */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="sm:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                                </svg>
                                Filters
                            </button>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {filteredExpenses.length} expenses
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-3 lg:ml-4">
                                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Expenses</p>
                                <p className="text-xl lg:text-2xl font-bold text-gray-900">{totalExpenses}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-2 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-3 lg:ml-4">
                                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Amount</p>
                                <p className="text-xl lg:text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-2 lg:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="ml-3 lg:ml-4">
                                <p className="text-xs lg:text-sm font-medium text-gray-600">Average</p>
                                <p className="text-xl lg:text-2xl font-bold text-gray-900">${averageAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center">
                            <div className="p-2 lg:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-3 lg:ml-4">
                                <p className="text-xs lg:text-sm font-medium text-gray-600">Highest</p>
                                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                                    {highest.expense
                                        ? `$${highest.total.toFixed(2)}`
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 ${showFilters || window.innerWidth >= 640 ? 'block' : 'hidden'}`}>
                    <div className="p-4 lg:p-6">
                        <div className="flex flex-col space-y-4 lg:flex-row lg:items-end lg:justify-between lg:space-y-0 lg:space-x-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Group</label>
                                    <select
                                        value={filterGroup}
                                        onChange={(e) => setFilterGroup(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="date">Date</option>
                                        <option value="amount">Amount</option>
                                        <option value="group">Group</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="desc">Newest/High to Low</option>
                                        <option value="asc">Oldest/Low to High</option>
                                    </select>
                                </div>
                            </div>

                            {(filterGroup !== 'all' || sortBy !== 'date' || sortOrder !== 'desc') && (
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Trend Chart */}
                {Object.keys(monthlyData).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Spending Trend</h3>
                        <div className="space-y-3">
                            {Object.entries(monthlyData)
                                .sort(([a], [b]) => new Date(a) - new Date(b))
                                .map(([month, amount]) => (
                                    <div key={month} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">{month}</span>
                                        <div className="flex items-center space-x-3 flex-1 ml-4">
                                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-xs">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                                                    style={{ 
                                                        width: `${(amount / Math.max(...Object.values(monthlyData))) * 100}%` 
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 min-w-0 flex-shrink-0">${amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Expenses List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 lg:px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Expense Details</h2>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {filteredExpenses.map((expense) => (
                            <div 
                                key={expense.id} 
                                className="px-4 lg:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/expenses/${expense.id}?from=${encodeURIComponent(location.pathname)}`)}
                            >
                                {/* Always use desktop layout, but adjust font sizes for mobile */}
                                <div className="flex flex-row items-start justify-between space-y-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-row items-center gap-2 sm:gap-3 mb-2">
                                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors">
                                                {expense.description || 'No description'}
                                            </h3>
                                            <span className="items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit truncate max-w-[120px] overflow-hidden">
                                                {getGroupName(expense.group_id)}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                            {formatDate(expense.created_at)}
                                        </p>
                                        {/* <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                Group ID: {expense.group_id}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                Expense ID: {expense.id}
                                            </span>
                                        </div> */}
                                    </div>
                                    
                                    <div className="flex flex-col items-end text-right space-y-2 min-w-[120px]">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-lg sm:text-2xl font-bold text-green-600">
                                                ${expense.total_amount.toFixed(2)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* view group button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/groups/${expense.group_id}`);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                                        >
                                            View Group
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredExpenses.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-4">No expenses found</p>
                            {filterGroup !== 'all' && (
                                <button
                                    onClick={() => setFilterGroup('all')}
                                    className="text-blue-500 hover:text-blue-700 font-medium"
                                >
                                    Clear filters and show all expenses
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;