import React, { useState } from 'react';
import "./bookings.css";

const Bookings = ({ handleBooking }) => {
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    roomType: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleBooking(e);
    setFormData({
      guestName: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      roomType: ''
    });
  };

  return (
    <div className="bookings">
      <h2>Room Bookings</h2>
      <div className="booking-form">
        <form id="bookingForm" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="guestName" 
            placeholder="Guest Name" 
            value={formData.guestName} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="tel" 
            name="phone" 
            placeholder="Phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="date" 
            name="checkIn" 
            placeholder="Check-in Date" 
            value={formData.checkIn} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="date" 
            name="checkOut" 
            placeholder="Check-out Date" 
            value={formData.checkOut} 
            onChange={handleChange} 
            required 
          />
          <select 
            name="roomType" 
            value={formData.roomType} 
            onChange={handleChange} 
            required
          >
            <option value="">Select Room Type</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
            <option value="Deluxe">Deluxe</option>
          </select>
          <button type="submit">Book Room</button>
        </form>
      </div>
      <div className="booking-list">
        <h3>Current Bookings</h3>
        <table id="bookingsTable">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Room Type</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="bookingsList">
            {/* Bookings will be dynamically added here */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
