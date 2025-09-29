import React, { useState } from 'react';
import { useAuth } from '../App'; // 1. Import the useAuth hook
import './bookings.css';

// 2. Remove all props from the component's definition
const Bookings = () => {
  // 3. Get all data and functions directly from the context
  const { 
    bookings, 
    services, 
    user, // The context provides 'user'
    handleBooking, 
    handleUpdateBookingStatus // The context provides 'handleUpdateBookingStatus'
  } = useAuth();

  const [formData, setFormData] = useState({
    service_id: '',
    date: '',
    time: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service_id || !formData.date || !formData.time) {
      alert("Please fill out all fields.");
      return;
    }
    handleBooking({
        ...formData,
        service_id: parseInt(formData.service_id)
    }); 
    setFormData({ service_id: '', date: '', time: '' });
  };

  return (
    <div className="bookings">
      <h2>Service Bookings</h2>
      <div className="booking-form">
        <h3>Book a New Service</h3>
        <form id="bookingForm" onSubmit={handleSubmit}>
          <select name="service_id" value={formData.service_id} onChange={handleChange} required>
            <option value="">-- Select a Service --</option>
            {/* 4. Add a check to ensure 'services' is an array before mapping */}
            {services && services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} (${service.price.toFixed(2)})
              </option>
            ))}
          </select>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          <input type="time" name="time" value={formData.time} onChange={handleChange} required />
          <button type="submit">Book Service</button>
        </form>
      </div>

      <div className="booking-list">
        <h3>{user?.isAdmin ? "All Bookings" : "Your Bookings"}</h3>
        <table id="bookingsTable">
          <thead>
            <tr>
              {user?.isAdmin && <th>Customer</th>}
              <th>Service</th>
              <th>Date & Time</th>
              <th>Status</th>
              {user?.isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.length > 0 ? (
              bookings.map(booking => (
                <tr key={booking.id}>
                  {user?.isAdmin && <td>{booking.user_full_name}</td>}
                  <td>{booking.service_name}</td>
                  <td>{new Date(booking.date).toLocaleDateString()} at {booking.time}</td>
                  <td>
                    <span className={`status-badge ${booking.status?.toLowerCase()}`}>{booking.status}</span>
                  </td>
                  {user?.isAdmin && (
                    <td>
                      <select 
                        className="status-select"
                        value={booking.status}
                        onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={user?.isAdmin ? 5 : 4}>No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;