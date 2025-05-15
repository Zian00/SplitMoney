import AuthForm from './components/AuthForm';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppRoutes = () => {
	const { auth } = useAuth();
	return auth?.token ? (
		<div className='text-center mt-20'>Logged in successfully!</div>
	) : (
		<AuthForm />
	);
};

const App = () => {
	return (
		<AuthProvider>
			<AppRoutes />
		</AuthProvider>
	);
};

export default App;
