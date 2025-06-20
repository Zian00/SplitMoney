import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

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
						<Link
							to='/'
							className='text-xl font-bold text-gray-800'
						>
							SplitMoney
						</Link>
						<div className='hidden md:flex space-x-6'>
							<Link
								to='/'
								className='text-gray-600 hover:text-gray-800'
							>
								Dashboard
							</Link>
							<Link
								to='/groups'
								className='text-gray-600 hover:text-gray-800'
							>
								Groups
							</Link>
							<Link
								to='/expenses'
								className='text-gray-600 hover:text-gray-800'
							>
								Expenses
							</Link>
						</div>
					</div>

					<div className='flex items-center space-x-4'>
						<Link
							to='/profile'
							className='flex items-center space-x-2 text-gray-600 hover:text-gray-800'
							title='Profile'
						>
							<FontAwesomeIcon
								icon={faUser}
								className='w-5 h-5 text-blue-500'
							/>
							<span>{user.name}</span>
						</Link>
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
