import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7');

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Sample data for charts
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue',
      data: [12000, 19000, 30000, 25000, 28000, 32000],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const occupancyData = {
    labels: ['Occupied', 'Vacant'],
    datasets: [{
      data: [82, 18],
      backgroundColor: ['#36A2EB', '#FF6384'],
      hoverBackgroundColor: ['#36A2EB', '#FF6384']
    }]
  };

  const serviceData = {
    labels: ['Room Service', 'Spa', 'Restaurant', 'Gym', 'Pool'],
    datasets: [{
      data: [42, 18, 36, 24, 30],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  };

  const roomTypeData = {
    labels: ['Single', 'Double', 'Suite', 'Deluxe'],
    datasets: [{
      label: 'Room Type Distribution',
      data: [30, 40, 20, 10],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderWidth: 1
    }]
  };

  const bookingsTrendData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [{
      label: 'Bookings',
      data: [10, 15, 12, 20, 18, 22, 25],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="analytics">
      <h2>Analytics Dashboard</h2>
      
      <div className="analytics-filters">
        <select id="timeRange" value={timeRange} onChange={handleTimeRangeChange}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Revenue Overview</h3>
          <div className="chart-container">
            <Bar data={revenueData} />
          </div>
          <div className="stat-summary">
            <div className="stat">
              <span>Total Revenue</span>
              <span id="totalRevenue">₹145,000</span>
            </div>
            <div className="stat">
              <span>Growth</span>
              <span id="revenueGrowth" className="positive">+12.5%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Occupancy Rate</h3>
          <div className="chart-container">
            <Pie data={occupancyData} />
          </div>
          <div className="stat-summary">
            <div className="stat">
              <span>Current Occupancy</span>
              <span id="currentOccupancy">82%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Service Usage</h3>
          <div className="chart-container">
            <Pie data={serviceData} />
          </div>
          <div className="stat-summary">
            <div className="stat">
              <span>Most Used Service</span>
              <span id="topService">Room Service</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Room Type Distribution</h3>
          <div className="chart-container">
            <Bar data={roomTypeData} />
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card full-width">
          <h3>Daily Bookings Trend</h3>
          <div className="chart-container1">
            <Bar data={bookingsTrendData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
