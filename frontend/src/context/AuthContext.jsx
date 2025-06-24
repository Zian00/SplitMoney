import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

const parseJwt = (token) => {
	try {
		return JSON.parse(atob(token.split('.')[1]));
	} catch (e) {
		return null;
	}
};

export const AuthProvider = ({ children }) => {
	const [auth, setAuth] = useState(() => {
		// The JWT (token) is stored in React context and in localStorage for persistence across reloads.
		const token = localStorage.getItem('token');
		const user = localStorage.getItem('user');

		if (token && user) {
			const decodedToken = parseJwt(token);
			// Check if token is expired
			if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
				return { token, user: JSON.parse(user) };
			}
		}

		// If no token, or user, or token is expired, clear storage
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		return null;
	});

	useEffect(() => {
		if (auth?.token) {
			localStorage.setItem('token', auth.token);
			localStorage.setItem('user', JSON.stringify(auth.user));
		} else {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
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
