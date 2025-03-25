import React, { useState } from 'react';

const Services = () => {
  const [services, setServices] = useState([
    { id: 'SRV001', type: 'Room Service', usage: 42, status: 'active' },
    { id: 'SRV002', type: 'Spa', usage: 18, status: 'active' },
    { id: 'SRV003', type: 'Restaurant', usage: 36, status: 'active' },
    { id: 'SRV004', type: 'Gym', usage: 24, status: 'maintenance' },
    { id: 'SRV005', type: 'Pool', usage: 30, status: 'active' }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleServiceStatusChange = (serviceId, newStatus) => {
    setServices(services.map(service => 
      service.id === serviceId ? { ...service, status: newStatus } : service
    ));
  };

  const filteredServices = filterStatus === 'all' 
    ? services 
    : services.filter(service => service.status === filterStatus);

  return (
    <div className="services">
      <h2>Services Management</h2>
      
      <div className="services-filters">
        <select id="serviceStatus" value={filterStatus} onChange={handleFilterChange}>
          <option value="all">All Services</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="maintenance">Maintenance</option>
          <option value="completed">Completed</option>
        </select>
        <button id="filterServicesBtn" onClick={() => setFilterStatus('all')}>Reset Filter</button>
      </div>

      <div className="services-table">
        <table>
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Service Type</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="servicesTableBody">
            {filteredServices.map(service => (
              <tr key={service.id} className="service-row" data-service-id={service.id} data-status={service.status}>
                <td>#{service.id}</td>
                <td>{service.type}</td>
                <td>{service.usage}</td>
                <td>
                  <span className={`status-badge ${service.status}`}>{service.status.charAt(0).toUpperCase() + service.status.slice(1)}</span>
                </td>
                <td>
                  <button 
                    className="action-btn" 
                    onClick={() => alert(`Booking ${service.type}`)}
                    disabled={service.status === 'maintenance'}
                  >
                    Book
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => handleServiceStatusChange(service.id, service.status === 'active' ? 'maintenance' : 'active')}
                  >
                    {service.status === 'active' ? 'Maintenance' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Services;
