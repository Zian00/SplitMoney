import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import GroupDetails from './components/GroupDetails';
import Expenses from './components/Expenses';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import InvitationHandler from './components/InvitationHandler';
import ExpenseDetails from './components/ExpenseDetails';
import ScrollToTop from './components/ScrollToTop';

const App = () => {
	const { auth } = useAuth();

	// console.log('Auth state:', auth);

	return (
		<Router>
			<ScrollToTop />
			{auth && <Navigation />}
			<div className="flex flex-col min-h-screen bg-gray-50 pb-16 md:pb-0">
				<Routes>
					{!auth ? (
						<>
							<Route path="/login" element={<AuthForm />} />
							<Route path="/forgot-password" element={<ForgotPasswordForm />} />
							<Route path="/reset-password/:token" element={<ResetPasswordForm />} />
							<Route path="*" element={<Navigate to="/login" replace />} />
						</>
					) : (
						<>
							<Route path="/" element={<Dashboard />} />
							<Route path="/groups" element={<Groups />} />
							<Route path="/groups/:groupId" element={<GroupDetails />} />
							<Route path="/expenses" element={<Expenses />} />
							<Route path="/expenses/:expenseId" element={<ExpenseDetails />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/invite/:token" element={<InvitationHandler />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</>
					)}
					{/* Add invite route for non-authed users if it's not there */}
					<Route path="/invite/:token" element={<InvitationHandler />} />
				</Routes>
			</div>
		</Router>
	);
};

export default App;
