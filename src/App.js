import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation, NavLink, Outlet } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Bookings from './components/Bookings';
import Services from './components/Services';
import Analytics from './components/Analytics';

// API base URL
const API_BASE_URL = 'http://localhost:8000';

// Create Auth Context
const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const login = useCallback((userCredentials, userData) => {
    setCredentials(userCredentials);
    setUser(userData);
    localStorage.setItem('credentials', userCredentials);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    setUser(null);
    localStorage.removeItem('credentials');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, credentials, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// AppWrapper is needed because App needs to use useLocation, which must be inside a Router
function AppWrapper() {
  return (
      <App />
  );
}

function App() {
  const [navTransparent, setNavTransparent] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Hide nav transparency logic if not on the home page
    if (location.pathname !== '/') {
        setNavTransparent(false);
        return;
    }

    // Set initial state based on scroll position
    setNavTransparent(window.scrollY < 100);

    const handleScroll = () => {
        if (window.scrollY > 100) {
            setNavTransparent(false);
        } else {
            setNavTransparent(true);
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Styles needed for the navigation to work
  const navStyles = `
    .nav-bar {
      top: 0;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      z-index: 1000;
      transition: background-color 0.5s ease;
    }
    .nav-bar.transparent {
      background-color: transparent;
    }
    .nav-bar:not(.transparent) {
      background-color: #111827; /* Dark background for scrolled nav */
      color: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .logo a {
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        text-decoration: none;
    }
    .nav-links {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }
     .nav-links a { color: white; text-decoration: none; }
     .logout-btn { background: #2563eb; color: white; border: none; padding: 0.7rem 1rem; border-radius: 0.5rem; cursor: pointer; }
     .menu-toggle { display: none; } /* Add responsive styles if needed */
  `;

  return (
    <AuthProvider>
      <style>{navStyles}</style>
      <AppContent 
        navTransparent={location.pathname === '/' && navTransparent} 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu} 
      />
    </AuthProvider>
  );
}

function AppContent({ navTransparent, isMenuOpen, toggleMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, credentials, login, logout } = useAuth();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  useEffect(() => {
    const storedCredentials = localStorage.getItem('credentials');
    const storedUser = localStorage.getItem('user');
    if (storedCredentials && storedUser) {
      login(storedCredentials, JSON.parse(storedUser));
    }
  }, [login]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Placeholder API call handlers
  const handleLogin = async (email, password) => {
    console.log("Logging in with:", email);
    const base64Credentials = btoa(`${email}:${password}`);
    login(base64Credentials, { email, isAdmin: email.includes('admin') }); // Mock login
    navigate('/bookings');
  };
  const handleSignup = async (email, password, fullName) => {
    console.log("Signing up:", email, fullName);
    alert('Account created! Please log in.');
    navigate('/login');
  };
  
  return (
    <div>
      <nav className={`nav-bar ${navTransparent ? 'transparent' : ''}`}>
        <div className="logo">
          <NavLink to="/">SuiteFlow</NavLink>
        </div>
        <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="hamburger"></div>
        </div>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <pa><NavLink to="/">Home</NavLink></pa>
          <pa><NavLink to="/services">Services</NavLink></pa>
          {user ? (
            <>
              <pa><NavLink to="/bookings">My Bookings</NavLink></pa>
              {user.isAdmin && (
                <pa><NavLink to="/analytics">Analytics</NavLink></pa>
              )}
              <pa><button className="logout-btn" onClick={handleLogout}>Logout</button></pa>
            </>
          ) : (
            <>
              <pa><NavLink to="/login">Login</NavLink></pa>
              <pa><NavLink to="/signup">Sign Up</NavLink></pa>
            </>
          )}
        </ul>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup handleSignup={handleSignup} />} />
        <Route 
          path="/bookings" 
          element={<ProtectedRoute><Bookings/></ProtectedRoute>} 
        />
        <Route path="/services" element={<Services />} />
        <Route 
          path="/analytics" 
          element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.isAdmin ? 'admin' : 'user')) {
    const fallbackPath = user.isAdmin ? '/analytics' : '/bookings';
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children || <Outlet />;
};

export default AppWrapper;
