import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Bookings from './components/Bookings';
import Services from './components/Services';
import Rooms from './components/Rooms';
import Analytics from './components/Analytics';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

const AuthContext = createContext(null);

/**
 * AuthProvider: This is the central component for managing all application state,
 * now using Basic Authentication.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // State is now for credentials (base64 string) instead of a token
  const [credentials, setCredentials] = useState(() => localStorage.getItem('credentials'));
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const navigate = useNavigate();

  // Centralized logout function - now clears credentials
  const logout = useCallback(() => {
    setCredentials(null);
    setUser(null);
    setBookings([]);
    setRooms([]);
    setStaff([]);
    localStorage.removeItem('credentials');
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);

  // Centralized API fetch utility that uses Basic Authentication
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    // Add the Basic Auth header if credentials exist
    if (credentials) {
        headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      if (response.status === 401) {
        logout(); // Automatically log out if credentials are invalid
      }
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || `Error: ${response.status}`);
    }
    return response.status === 204 ? null : await response.json();
  }, [credentials, logout]);

  // This effect runs on initial load to restore the session from localStorage
  useEffect(() => {
    const bootstrapAppData = async () => {
      // Public data is always fetched
      try {
        // Use fetch directly for public data to avoid auth logic complications
        const servicesData = await fetch(`${API_BASE_URL}/services/`).then(res => res.json());
        setServices(servicesData);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
      
      // If credentials exist, validate them by fetching user data
      const storedUser = localStorage.getItem('user');
      if (credentials && storedUser) {
        setUser(JSON.parse(storedUser));
        try {
          // Fetch all protected data
          const [bookingsData, roomsData, staffData] = await Promise.all([
            apiFetch('/bookings/'),
            apiFetch('/rooms/'),
            apiFetch('/staff/'),
          ]);
          setBookings(bookingsData);
          setRooms(roomsData);
          setStaff(staffData);
        } catch (error) {
          console.error("Session expired or invalid:", error);
          logout(); // Credentials might be stale, so log out
        }
      }
    };
    bootstrapAppData();
  }, [credentials, apiFetch, logout]);

  // --- Handler Functions ---

  const handleLogin = async (email, password) => {
    try {
      const base64Credentials = btoa(`${email}:${password}`);
      // The POST to /token verifies credentials and returns user data
      const userData = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${base64Credentials}` },
      }).then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
      });

      // Store credentials and user data on successful login
      localStorage.setItem('credentials', base64Credentials);
      localStorage.setItem('user', JSON.stringify(userData));
      setCredentials(base64Credentials);
      setUser(userData);
      navigate('/bookings');
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const handleSignup = async (email, password, fullName) => {
    try {
      // Signup doesn't require auth, so use fetch directly
      await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      alert('Signup failed: ' + err.message);
    }
  };

  const handleBooking = async (bookingData) => {
    try {
      await apiFetch('/bookings/', { method: 'POST', body: JSON.stringify(bookingData) });
      const updatedBookings = await apiFetch('/bookings/');
      setBookings(updatedBookings);
      alert('Booking successful!');
    } catch (err) {
      alert('Booking failed: ' + err.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await apiFetch(`/bookings/${bookingId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
      alert('Booking status updated!');
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleUpdateRoomStatus = async (roomId, status) => {
    try {
      await apiFetch(`/rooms/${roomId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setRooms(rooms.map(r => r.id === roomId ? { ...r, status } : r));
    } catch (err) {
      alert('Failed to update room status: ' + err.message);
    }
  };

  const handleAddStaff = async (fullName, specialty) => {
    try {
      const newStaffMember = await apiFetch('/staff/', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, specialty }),
      });
      setStaff([...staff, newStaffMember]);
    } catch (err) {
      alert('Failed to add staff member: ' + err.message);
    }
  };
  
  // The complete value provided by the AuthContext
  const value = {
    user,
    credentials,
    isAuthenticated: !!user, // App is authenticated if the user object exists
    services,
    bookings,
    rooms,
    staff,
    logout,
    handleLogin,
    handleSignup,
    handleBooking,
    handleUpdateBookingStatus,
    handleUpdateRoomStatus,
    handleAddStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access the context
export const useAuth = () => useContext(AuthContext);

// The main App component
function App() {
  const location = useLocation();
  const [navTransparent, setNavTransparent] = useState(location.pathname === '/');
  const { user, isAuthenticated, logout } = useAuth();
  
  useEffect(() => {
    if (location.pathname !== '/') {
      setNavTransparent(false);
      return;
    }
    const handleScroll = () => setNavTransparent(window.scrollY < 100);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div>
      <nav className={`nav-bar ${navTransparent ? 'transparent' : ''}`}>
        <div className="logo"><NavLink to="/">SuiteFlow</NavLink></div>
        <ul className="nav-links">
          <pa><NavLink to="/">Home</NavLink></pa>
          {isAuthenticated ? (
            <>
              <pa><NavLink to="/bookings">My Bookings</NavLink></pa>
              {user?.isAdmin && (
                <>
                  <pa><NavLink to="/analytics">Analytics</NavLink></pa>
                  <pa><NavLink to="/services">Services</NavLink></pa>
                  <pa><NavLink to="/rooms">Rooms & Staff</NavLink></pa>
                </>
              )}
              <pa><button className="logout-btn" onClick={logout}>Logout</button></pa>
            </>
          ) : (
            <>
              <pa><NavLink to="/login">Login</NavLink></pa>
              <pa><NavLink to="/signup">Sign Up</NavLink></pa>
            </>
          )}
        </ul>
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services" element={
            <ProtectedRoute isAdminOnly={true}>
              <Services />
            </ProtectedRoute>
            } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }/>
          <Route path="/analytics" element={
            <ProtectedRoute isAdminOnly={true}>
              <Analytics />
            </ProtectedRoute>
          }/>
          <Route path="/rooms" element={
            <ProtectedRoute isAdminOnly={true}>
              <Rooms />
            </ProtectedRoute>
          }/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ProtectedRoute component
const ProtectedRoute = ({ children, isAdminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (isAdminOnly && !user?.isAdmin) {
    return <Navigate to="/bookings" replace />;
  }
  
  return children;
};

// The AppWrapper is the root component
function AppWrapper() {
  return (
      <AuthProvider>
        <App />
      </AuthProvider>
  );
}

export default AppWrapper;

