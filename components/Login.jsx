"use client"
import { useState, useEffect } from "react";
import { Eye, EyeOff, Calendar } from "lucide-react";
import Cookies from "js-cookie";
import TabsLayout from "./TabsLayout";
import { supabase } from "@/lib/supabase"; // Add this import

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const session = Cookies.get('supabase-auth-token');
    if (session) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        Cookies.set('supabase-auth-token', JSON.stringify(data.session), { expires: 7 });
        setSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1500);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // If logged in, show TabsLayout instead of login form
  if (isLoggedIn) {
    return <TabsLayout />;
  }

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Header */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              {/* Add an icon here if needed */}
            </div>
          </div>
          <h1>Annas Cafe</h1>
          <p>Access your business insights and financial performance</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="card-content">
            <h2>Sign in to your account</h2>
            
            {error && (
              <div className="error-message">
                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {success}
              </div>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hotel.com"
                  color="black"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    color="black"
                    
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="input-icon" />
                    ) : (
                      <Eye className="input-icon" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <span className="loading-container">
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>
          
          <div className="card-footer">
            <div className="footer-content">
              <Calendar className="footer-icon" />
              <p>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .login-content {
          max-width: 28rem;
          width: 100%;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .logo-icon {
          background: linear-gradient(to right, #f97316, #f59e0b);
          padding: 0.75rem;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          height: 3rem;
          width: 3rem;
        }
        
        .login-header h1 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .login-header p {
          color: #4b5563;
        }
        
        .login-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #f3f4f6;
        }
        
        .card-content {
          padding: 2rem;
        }
        
        .login-card h2 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }
        
        .error-message {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #fef2f2;
          color: #b91c1c;
          border-radius: 0.5rem;
          border: 1px solid #fee2e2;
          display: flex;
          align-items: center;
        }
        
        .success-message {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #f0fdf4;
          color: #166534;
          border-radius: 0.5rem;
          border: 1px solid #dcfce7;
          display: flex;
          align-items: center;
        }
        
        .error-icon, .success-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }
        
        .input-group {
          margin-bottom: 1rem;
        }
        
        .input-group label {
          display: block;
          color:rgb(0, 0, 0);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
      
        }
        
        .input-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          transition: all 0.2s;
          color:black
        }
        
        .input-group input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
        
        .password-input-container {
          position: relative;
        }
        
        .password-toggle {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          padding-right: 0.75rem;
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        
        .input-icon {
          height: 1.25rem;
          width: 1.25rem;
          color: #9ca3af;
        }
        
        .login-button {
          width: 100%;
          background: linear-gradient(to right, #f97316, #f59e0b);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .login-button:hover:not(:disabled) {
          background: linear-gradient(to right, #ea580c, #d97706);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .login-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.5);
        }
        
        .login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
          height: 1.25rem;
          width: 1.25rem;
          margin-right: 0.75rem;
        }
        
        .spinner-circle {
          opacity: 0.25;
        }
        
        .spinner-path {
          opacity: 0.75;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .card-footer {
          padding: 1rem 2rem;
          background-color: #f9fafb;
          border-top: 1px solid #f3f4f6;
        }
        
        .footer-content {
          display: flex;
          align-items: center;
        }
        
        .footer-icon {
          height: 1rem;
          width: 1rem;
          color: #9ca3af;
          margin-right: 0.5rem;
        }
        
        .footer-content p {
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;