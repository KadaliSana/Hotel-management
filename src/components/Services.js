import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import "./services.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const Services = () => {
 const [services, setServices] = useState([]);
 const [bookings, setBookings] = useState([]);
 const [filterStatus, setFilterStatus] = useState('all');
 const [error, setError] = useState(null);
 const [loading, setLoading] = useState(true);
 // Added state for the new service form fields
 const [newService, setNewService] = useState({ name: '', description: '', price: '', status: 'active' }); 
 
 // Use the central authentication context
 const { credentials, logout } = useAuth();

 // Central API fetcher for this component
 const apiFetch = useCallback(async (endpoint, options = {}) => {
  if (!credentials) {
   throw new Error("Not authenticated");
  }
  try {
   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Basic ${credentials}`,
     ...options.headers,
    },
   });
   if (!response.ok) {
    // If unauthorized, log the user out
    if (response.status === 401 || response.status === 403) {
      logout();
    }
    const errData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errData.detail || `Error: ${response.status}`);
   }
   return response.status === 204 ? null : await response.json();
  } catch (err) {
   console.error(`API call to ${endpoint} failed:`, err);
   setError(err.message);
   throw err; // Re-throw to be caught by callers
  }
 }, [credentials, logout]);


 const fetchServices = useCallback(async () => {
  // This endpoint is public
  let url = `/services/`;
  if (filterStatus !== 'all') {
   url += `?status=${filterStatus}`;
  }
  try {
   const response = await fetch(`${API_BASE_URL}${url}`);
   if (!response.ok) throw new Error(`Failed to fetch services`);
   const data = await response.json();
   // Add default 'active' status if the database record lacks it
   const servicesWithDefaultStatus = (Array.isArray(data) ? data : []).map(service => ({
    ...service,
    status: service.status || 'active'
   }));
   setServices(servicesWithDefaultStatus);
  } catch (e) {
   setError(e.message);
  }
 }, [filterStatus]);

 const fetchAllBookings = useCallback(async () => {
  try {
    const data = await apiFetch('/bookings/');
    setBookings(Array.isArray(data) ? data : []);
  } catch(e) {
    // Error is already set by apiFetch
  }
 }, [apiFetch]);

 useEffect(() => {
  setLoading(true);
  setError(null);
  
  const promises = [fetchServices()];
  if (credentials) {
   promises.push(fetchAllBookings());
  }

  Promise.all(promises).finally(() => setLoading(false));
 }, [credentials, fetchServices, fetchAllBookings]);

 const handleServiceStatusChange = async (serviceId, newStatus) => {
  try {
   await apiFetch(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus }),
   });
   fetchServices(); // Refresh the list
  } catch (e) {
   // Error is already set by apiFetch
  }
 };

 const handleBookingStatusUpdate = async (bookingId, newStatus) => {
  try {
    await apiFetch(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    fetchAllBookings(); // Refresh bookings list
  } catch(e) {
    // Error is already set by apiFetch
  }
 };

 // Handler for the Add Service form submission
 const handleAddService = async (e) => {
  e.preventDefault();
  if (!newService.name || !newService.price) {
   setError("Service name and price are required.");
   return;
  }

  try {
   await apiFetch('/services/', {
    method: 'POST',
    body: JSON.stringify({ ...newService, price: parseFloat(newService.price) }),
   });
   // Clear form and refresh service list
   setNewService({ name: '', description: '', price: '', status: 'active' });
   fetchServices();
   setError(null); 
  } catch (e) {
   // Error is already set by apiFetch
  }
 };


 return (
  <>
   <div className="admin-dashboard">
    <h2>Admin Dashboard</h2>
    {error && <div className="error-message">{error}</div>}
    <div className="dashboard-section">
     <h3>Services Management</h3>
     <h4>Add New Service</h4>
     <form className="add-service-form" onSubmit={handleAddService}>
      <input
       type="text"
       placeholder="Service Name (e.g., Haircut)"
       value={newService.name}
       onChange={(e) => setNewService({ ...newService, name: e.target.value })}
       required
      />
      <input
       type="number"
       step="0.01"
       placeholder="Price (e.g., 50.00)"
       value={newService.price}
       onChange={(e) => setNewService({ ...newService, price: e.target.value })}
       required
      />
      <input
       type="text"
       placeholder="Description (Optional)"
       value={newService.description}
       onChange={(e) => setNewService({ ...newService, description: e.target.value })}
      />
      <button type="submit">Add Service</button>
     </form>
     <h4>Existing Services</h4>
     <div className="filters">
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
       <option value="all">All Services</option>
       <option value="active">Active</option>
       <option value="maintenance">Maintenance</option>
      </select>
     </div>
     <div className="table-wrapper">
      <table>
       <thead>
        <tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th></tr>
       </thead>
       <tbody>{
        loading ? 
         <tr><td colSpan="6">Loading...</td></tr> 
        : services.map(service => (
         <tr key={service.id}>
          <td>#{service.id}</td>
          <td>{service.name}</td>
          <td>{service.description}</td>
          <td>{service.price.toFixed(2)}</td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
    <div className="dashboard-section">
      <h3>All Bookings</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Customer</th><th>Service</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>{
            loading ? 
              <tr><td colSpan="5">Loading...</td></tr> 
            : bookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.user_full_name}</td>
                <td>{booking.service_name}</td>
                <td>{new Date(booking.date).toLocaleDateString()} at {booking.time}</td>
                <td><span className={`status-badge ${booking.status?.toLowerCase()}`}>{booking.status}</span></td>
                <td><select className="status-select" value={booking.status} onChange={(e) => handleBookingStatusUpdate(booking.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
   </div>
  </>
 );
};

export default Services;
