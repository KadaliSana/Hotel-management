import React, { useState, useEffect, createContext, useContext } from 'react';
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

  const login = (userCredentials, userData) => {
    setCredentials(userCredentials);
    setUser(userData);
    localStorage.setItem('credentials', userCredentials);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setCredentials(null);
    setUser(null);
    localStorage.removeItem('credentials');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, credentials, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

function App() {
  const [navTransparent, setNavTransparent] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Navigation transparency toggle on scroll
    const hero = document.querySelector('.hero');
    if (hero) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          setNavTransparent(entry.isIntersecting);
        });
      }, { root: null, threshold: 0.5 });
      observer.observe(hero);
    }
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <AuthProvider>
      <AppContent 
        navTransparent={navTransparent} 
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
  
  useEffect(() => {
    // Fetch services when component mounts
    fetchServices();
    
    // Fetch bookings if user is logged in
    if (user && credentials) {
      fetchBookings();
    }
  }, [user, credentials]);
  
  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };
  
  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleBooking = async (serviceId, date, time) => {
    if (!user) {
      alert('Please log in to book a service.');
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          service_id: serviceId,
          date,
          time
        })
      });
      
      if (response.ok) {
        alert('Booking successful!');
        fetchBookings(); // Refresh bookings
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error creating booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking process error:', error);
      alert('Booking failed. Please try again.');
    }
  };
  
  const handleLogin = async (email, password) => {
    try {
      // Create base64 encoded credentials
      const base64Credentials = btoa(`${email}:${password}`);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Credentials}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        login(base64Credentials, userData);
        navigate(userData.isAdmin ? '/analytics' : '/bookings');
      } else {
        alert('Invalid credentials.');
      }
    } catch (error) {
      console.error('Login process error:', error);
      alert('Login failed. Please try again.');
    }
  };
  
  const handleSignup = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName 
        }),
      });
      
      if (response.ok) {
        alert('Account created successfully! Please log in.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error creating account. Please try again.');
      }
    } catch (error) {
      console.error('Signup process error:', error);
      alert('Signup failed. Please try again.');
    }
  };
  
  const updateBookingStatus = async (bookingId, status) => {
    if (!user || !user.isAdmin) {
      alert('Only admins can update booking status.');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        alert('Booking status updated successfully!');
        fetchBookings(); // Refresh bookings
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error updating booking. Please try again.');
      }
    } catch (error) {
      console.error('Update booking error:', error);
      alert('Update failed. Please try again.');
    }
  };
  
  return (
    <div>
      <nav className={navTransparent ? 'transparent' : 'nav-bar'}>
        <div className="logo">
          <NavLink to="/">SalonBooker</NavLink>
        </div>
        <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="hamburger"></div>
        </div>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <p><NavLink to="/" className={location.pathname === '/' ? 'active' : ''}>Home</NavLink></p>
          <p><NavLink to="/services" className={location.pathname === '/services' ? 'active' : ''}>Services</NavLink></p>
          {user ? (
            <>
              <p><NavLink to="/bookings" className={location.pathname === '/bookings' ? 'active' : ''}>My Bookings</NavLink></p>
              {user.isAdmin && (
                <p><NavLink to="/analytics" className={location.pathname === '/analytics' ? 'active' : ''}>Analytics</NavLink></p>
              )}
              <p><button className="logout-btn" onClick={handleLogout}>Logout</button></p>
            </>
          ) : (
            <>
              <p><NavLink to="/login" className={location.pathname === '/login' ? 'active' : ''}>Login</NavLink></p>
              <p><NavLink to="/signup" className={location.pathname === '/signup' ? 'active' : ''}>Sign Up</NavLink></p>
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
          element={
            <ProtectedRoute>
              <Bookings 
                handleBooking={handleBooking} 
                bookings={bookings} 
                services={services} 
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/services" 
          element={<Services services={services} handleBooking={handleBooking} />} 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics 
                bookings={bookings} 
                services={services} 
                updateBookingStatus={updateBookingStatus} 
              />
            </ProtectedRoute>
          } 
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


export default App;
