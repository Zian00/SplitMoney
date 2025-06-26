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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 text-center transform hover:scale-[1.02] transition-all duration-300">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg 
                                className="w-8 h-8 sm:w-10 sm:h-10 text-white" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" 
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                            Processing Invitation
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            We're verifying your invitation details
                        </p>
                    </div>

                    {/* Loading Animation */}
                    <div className="mb-6">
                        <div className="relative">
                            {/* Outer ring */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-4 border-blue-100"></div>
                            
                            {/* Spinning ring */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                        </div>
                    </div>

                    {/* Status Message */}
                    <div className="space-y-2">
                        <p className="text-gray-700 font-medium text-sm sm:text-base">
                            Almost there...
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm">
                            This should only take a moment
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-xs sm:text-sm">
                        Having trouble? Contact our support team
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvitationHandler;