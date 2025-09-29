import React,  { useState } from 'react';
import { useAuth } from '../App'; // 1. Import the useAuth hook

// 2. The component no longer accepts any props
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // 3. Get the handleLogin function directly from the AuthContext
    const { handleLogin } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        // 4. Call the function from the context
        handleLogin(email, password);
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h2>Login</h2>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="btn">Login</button>
            </form>
        </div>
    );
};

export default Login;

