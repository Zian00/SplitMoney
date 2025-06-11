import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [auth, setAuth] = useState(null);
	console.log('AuthContext state:', auth);

	useEffect(() => {
		if (auth?.token) {
			localStorage.setItem('token', auth.token);
		} else {
			localStorage.removeItem('token');
		}
	}, [auth]);

	return (
		<AuthContext.Provider value={{ auth, setAuth }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
