import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAuth } from '../App'; 
import "./analytics.css";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:8000/analytics';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const { credentials } = useAuth();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!credentials) return;
      setLoading(true);
      try {
        const headers = { 'Authorization': `Basic ${credentials}` };
        
        const [revenueRes, occupancyRes, serviceRes] = await Promise.all([
          fetch(`${API_BASE_URL}/revenue?days=${timeRange}`, { headers }),
          fetch(`${API_BASE_URL}/occupancy`, { headers }),
          fetch(`${API_BASE_URL}/services?days=${timeRange}`, { headers }),
        ]);

        const revenue = await revenueRes.json();
        const occupancy = await occupancyRes.json();
        const serviceUsage = await serviceRes.json();

        setChartData({ revenue, occupancy, serviceUsage });
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange, credentials]);

  if (loading) {
    return <div className="analytics"><h2>Loading analytics...</h2></div>;
  }

  return (
    <div className="analytics">
      <h2>Analytics Dashboard</h2>
      <div className="analytics-filters">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Revenue Overview</h3>
          <div className="chart-container">
            {chartData.revenue?.datasets && <Bar data={chartData.revenue} />}
          </div>
        </div>
        <div className="analytics-card">
          <h3>Occupancy Rate</h3>
          <div className="chart-container">
            {chartData.occupancy?.datasets && <Pie data={chartData.occupancy} />}
          </div>
        </div>
        <div className="analytics-card">
          <h3>Service Usage</h3>
          <div className="chart-container">
            {chartData.serviceUsage?.datasets && <Pie data={chartData.serviceUsage} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;