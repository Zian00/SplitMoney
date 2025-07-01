import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faUser, 
	faHome, 
	faUsers, 
	faReceipt, 
} from '@fortawesome/free-solid-svg-icons';

const Navigation = () => {
	const { auth, setAuth } = useAuth();
	const user = auth?.user;
	const navigate = useNavigate();
	const location = useLocation();


	

	const isActive = (path) => {
		return location.pathname === path;
	};

	if (!user) {
		return null;
	}

	const navigationItems = [
		{ path: '/', label: 'Dashboard', icon: faHome },
		{ path: '/groups', label: 'Groups', icon: faUsers },
		{ path: '/expenses', label: 'Expenses', icon: faReceipt },
	];

	return (
		<>
			{/* Desktop Navigation */}
			<nav className='hidden md:block bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50'>
				<div className='container mx-auto px-6'>
					<div className='flex justify-between items-center h-16'>
						{/* Logo */}
						<div className='flex items-center'>
							<Link to='/' className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
								SplitMoney
							</Link>
						</div>

						{/* Desktop Navigation Links */}
						<div className='flex items-center space-x-8'>
							{navigationItems.map((item) => (
								<Link
									key={item.path}
									to={item.path}
									className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
										isActive(item.path)
											? 'bg-blue-100 text-blue-700 font-medium'
											: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
									}`}
								>
									<FontAwesomeIcon icon={item.icon} className='w-4 h-4' />
									<span>{item.label}</span>
								</Link>
							))}
						</div>

						{/* Desktop User Menu */}
						<div className='flex items-center space-x-4'>
							<Link
								to='/profile'
								className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
									isActive('/profile')
										? 'bg-blue-100 text-blue-700 font-medium'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}
							>
								<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
									<FontAwesomeIcon icon={faUser} className='w-4 h-4 text-white' />
								</div>
								<span className='font-medium'>{user.name}</span>
							</Link>
						</div>
					</div>
				</div>
			</nav>

			
			{/* Mobile Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg">
				<div className="flex justify-around items-center h-14">
					<Link to="/" className={`flex flex-col items-center justify-center flex-1 ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}>
						<FontAwesomeIcon icon={faHome} className="w-5 h-5 mb-1" />
						<span className="text-xs">Home</span>
					</Link>
					<Link to="/groups" className={`flex flex-col items-center justify-center flex-1 ${isActive('/groups') ? 'text-blue-600' : 'text-gray-500'}`}>
						<FontAwesomeIcon icon={faUsers} className="w-5 h-5 mb-1" />
						<span className="text-xs">Groups</span>
					</Link>
					<Link to="/expenses" className={`flex flex-col items-center justify-center flex-1 ${isActive('/expenses') ? 'text-blue-600' : 'text-gray-500'}`}>
						<FontAwesomeIcon icon={faReceipt} className="w-5 h-5 mb-1" />
						<span className="text-xs">Expenses</span>
					</Link>
					<Link to="/profile" className={`flex flex-col items-center justify-center flex-1 ${isActive('/profile') ? 'text-blue-600' : 'text-gray-500'}`}>
						<FontAwesomeIcon icon={faUser} className="w-5 h-5 mb-1" />
						<span className="text-xs">Profile</span>
					</Link>
				</div>
			</div>
		</>
	);
};

export default Navigation;