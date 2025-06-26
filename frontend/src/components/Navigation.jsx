import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faUser, 
	faHome, 
	faUsers, 
	faReceipt, 
	faSignOutAlt,
	faBars,
	faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

const Navigation = () => {
	const { auth, setAuth } = useAuth();
	const user = auth?.user;
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		setAuth(null);
		navigate('/');
		setIsMobileMenuOpen(false);
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

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
							<button
								onClick={handleLogout}
								className='flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg'
							>
								<FontAwesomeIcon icon={faSignOutAlt} className='w-4 h-4' />
								<span>Logout</span>
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile Top Bar */}
			<div className='md:hidden bg-white shadow-md border-b border-gray-200 sticky top-0 z-50'>
				<div className='flex justify-between items-center px-4 h-14'>
					<Link to='/' className='text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
						SplitMoney
					</Link>
					<div className='flex items-center space-x-3'>
						<Link to='/profile' className='p-2'>
							<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
								<FontAwesomeIcon icon={faUser} className='w-4 h-4 text-white' />
							</div>
						</Link>
						<button
							onClick={toggleMobileMenu}
							className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
						>
							<FontAwesomeIcon 
								icon={isMobileMenuOpen ? faTimes : faBars} 
								className='w-5 h-5 text-gray-600' 
							/>
						</button>
					</div>
				</div>

				{/* Mobile Dropdown Menu */}
				{isMobileMenuOpen && (
					<div className='absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40'>
						<div className='px-4 py-2'>
							<div className='flex items-center space-x-3 py-3 border-b border-gray-100'>
								<div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
									<FontAwesomeIcon icon={faUser} className='w-5 h-5 text-white' />
								</div>
								<div>
									<p className='font-medium text-gray-900'>{user.name}</p>
									<p className='text-sm text-gray-500'>Welcome back!</p>
								</div>
							</div>
							<div className='py-2'>
								{navigationItems.map((item) => (
									<Link
										key={item.path}
										to={item.path}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
											isActive(item.path)
												? 'bg-blue-100 text-blue-700'
												: 'text-gray-600 hover:bg-gray-50'
										}`}
									>
										<FontAwesomeIcon icon={item.icon} className='w-5 h-5' />
										<span className='font-medium'>{item.label}</span>
									</Link>
								))}
								<Link
									to='/profile'
									onClick={() => setIsMobileMenuOpen(false)}
									className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
										isActive('/profile')
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-600 hover:bg-gray-50'
									}`}
								>
									<FontAwesomeIcon icon={faUser} className='w-5 h-5' />
									<span className='font-medium'>Profile</span>
								</Link>
								<button
									onClick={handleLogout}
									className='flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left'
								>
									<FontAwesomeIcon icon={faSignOutAlt} className='w-5 h-5' />
									<span className='font-medium'>Logout</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default Navigation;