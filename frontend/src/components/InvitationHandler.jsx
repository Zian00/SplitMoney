import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

const InvitationHandler = () => {
    const { token } = useParams();
    const { auth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth) {
            // If user is not logged in, store the token and redirect to register page
            localStorage.setItem('pending_invite_token', token);
            toast.info('Please register to accept the invitation.');
            navigate('/login', { state: { defaultMode: 'register' } }); // Pass state here
            return;
        }

        const acceptInvite = async () => {
            try {
                const res = await apiClient.get(`/api/invites/accept/${token}`, {
                    headers: { Authorization: `Bearer ${auth.token}` },
                });
                toast.success("You've successfully joined the group!");
                localStorage.removeItem('pending_invite_token');
                navigate(`/groups/${res.data.group_id}`);
            } catch (err) {
                toast.error(err.response?.data?.detail || 'Failed to accept invitation');
                navigate('/');
            }
        };

        acceptInvite();
    }, [auth, token, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Processing Your Invitation</h2>
                <div className="flex justify-center items-center mb-4">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="text-gray-600">Please wait a moment while we verify your invitation...</p>
            </div>
        </div>
    );
};

export default InvitationHandler;
