import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
	const { auth, setAuth } = useAuth();
	const user = auth?.user; // Extract user from auth
	const navigate = useNavigate();

	const handleLogout = () => {
		setAuth(null);
		navigate('/'); // Navigate to home after logout
	};

	if (!user) {
		return null; // Don't render navigation if no user
	}

	return (
		<nav className='bg-white shadow-md'>
			<div className='container mx-auto px-4'>
				<div className='flex justify-between items-center h-16'>
					<div className='flex items-center space-x-8'>
						<Link to="/" className="text-xl font-bold text-gray-800">
							SplitMoney
						</Link>
						<div className='hidden md:flex space-x-6'>
							<Link to="/" className='text-gray-600 hover:text-gray-800'>
								Dashboard
							</Link>
							<Link to="/groups" className='text-gray-600 hover:text-gray-800'>
								Groups
							</Link>
							<Link to="/expenses" className='text-gray-600 hover:text-gray-800'>
								Expenses
							</Link>
						</div>
					</div>

					<div className='flex items-center space-x-4'>
						<span className='text-gray-600'>{user.email}</span>
						<button
							onClick={handleLogout}
							className='bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors'
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navigation;
