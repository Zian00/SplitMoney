import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const Expenses = () => {
    const { auth } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await apiClient.get('/api/expenses');
            setExpenses(response.data);
        } catch (err) {
            setError('Failed to load expenses');
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">All Expenses</h1>
                <p className="text-gray-600 mt-2">View and manage all expenses</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Expense List</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                        <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">
                                        {expense.description || 'No description'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Group ID: {expense.group_id} • 
                                        Created: {new Date(expense.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-semibold text-green-600">
                                        ${expense.total_amount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {expenses.length === 0 && (
                    <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">No expenses found</p>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-blue-600">Total Expenses:</span> {expenses.length}
                    </div>
                    <div>
                        <span className="text-blue-600">Total Amount:</span> $
                        {expenses.reduce((sum, expense) => sum + expense.total_amount, 0).toFixed(2)}
                    </div>
                    <div>
                        <span className="text-blue-600">Average Amount:</span> $
                        {expenses.length > 0 
                            ? (expenses.reduce((sum, expense) => sum + expense.total_amount, 0) / expenses.length).toFixed(2)
                            : '0.00'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses; 