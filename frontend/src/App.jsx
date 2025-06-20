import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import GroupDetails from './components/GroupDetails';
import Expenses from './components/Expenses';
import Navigation from './components/Navigation';
import Profile from './components/Profile';

const App = () => {
	const { auth } = useAuth();

	// console.log('Auth state:', auth);

	if (!auth) {
		return <AuthForm />;
	}

	return (
		<Router>
			<div className="min-h-screen bg-gray-50">
				<Navigation />
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/groups" element={<Groups />} />
					<Route path="/groups/:groupId" element={<GroupDetails />} />
					<Route path="/expenses" element={<Expenses />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</div>
		</Router>
	);
};

export default App;
