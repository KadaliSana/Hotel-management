import React, { useState } from 'react';
import { useAuth } from '../App';
import './rooms.css';

const Rooms = () => {
  const { rooms, staff, handleUpdateRoomStatus, handleAddStaff } = useAuth();
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffSpecialty) {
      alert("Please provide both name and specialty for the new staff member.");
      return;
    }
    handleAddStaff(newStaffName, newStaffSpecialty);
    setNewStaffName('');
    setNewStaffSpecialty('');
  };

  return (
    <div className="rooms-staff-page">
      <div className="management-section">
        <h2>Room Management</h2>
        <div className="room-grid">
          {rooms && rooms.length > 0 ? (
            rooms.map(room => (
              <div key={room.id} className={`room-card status-${room.status}`}>
                <div className="room-card-header">
                  <h3>Room {room.room_number}</h3>
                  <span className="room-type">{room.type}</span>
                </div>
                <p className="room-price">{room.price_per_night.toFixed(2)} / night</p>
                <div className="room-status-control">
                  <label htmlFor={`status-${room.id}`}>Status:</label>
                  <select
                    id={`status-${room.id}`}
                    value={room.status}
                    onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <p>No rooms found.</p>
          )}
        </div>
      </div>

      <div className="management-section">
        <h2>Staff Management</h2>
        <div className="staff-content">
          <div className="add-staff-form">
            <h3>Add New Staff</h3>
            <form onSubmit={handleStaffSubmit}>
              <input
                type="text"
                placeholder="Full Name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Specialty (e.g., Stylist, Front Desk)"
                value={newStaffSpecialty}
                onChange={(e) => setNewStaffSpecialty(e.target.value)}
                required
              />
              <button type="submit">Add Staff</button>
            </form>
          </div>
          <div className="staff-list">
            <h3>Current Staff</h3>
            <ul>
              {staff && staff.length > 0 ? (
                staff.map(member => (
                  <li key={member.id}>
                    <strong>{member.full_name}</strong> - {member.specialty}
                  </li>
                ))
              ) : (
                <li>No staff members found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
