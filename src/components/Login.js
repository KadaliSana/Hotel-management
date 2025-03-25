import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Login = ({handleLogin}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the login logic, like sending data to an API
    handleLogin(email,password);
    navigate('/bookings');
    // Reset form fields after submission
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login">
      <div className="login-form">
        <h2>Login</h2>
        <form id="loginForm" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="/signup">Sign up</a></p>
      </div>
    </div>
  );
};

export default Login;
