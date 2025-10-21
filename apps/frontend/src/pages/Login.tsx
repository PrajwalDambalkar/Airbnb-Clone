// src/pages/Login.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../App';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark } = useDarkMode();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/'); // Redirect to home after login
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col justify-center min-h-screen py-12 ${isDark ? 'bg-gray-950' : 'bg-gray-50'} sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Title */}
        <h2 className="text-center text-4xl font-bold text-[#FF385C] mb-2">
          airbnb
        </h2>
        <h3 className={`text-2xl font-semibold text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Welcome back
        </h3>
        <p className={`mt-2 text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Log in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`px-4 py-8 shadow-lg sm:rounded-lg sm:px-10 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className={`px-4 py-3 border rounded-lg ${isDark ? 'text-red-400 border-red-900 bg-red-950' : 'text-red-700 border-red-200 bg-red-50'}`}>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Must be at least 6 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF385C] to-[#E31C5F] hover:from-[#E31C5F] hover:to-[#D70466] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF385C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>

            {/* Quick Login Helpers (for testing) */}
            <div className={`p-3 mt-4 border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`mb-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick test login:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'traveler@test.com', password: 'password123' })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${isDark ? 'text-blue-400 bg-blue-950 hover:bg-blue-900' : 'text-blue-700 bg-blue-100 hover:bg-blue-200'}`}
                >
                  Traveler Account
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: 'owner@test.com', password: 'password123' })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${isDark ? 'text-green-400 bg-green-950 hover:bg-green-900' : 'text-green-700 bg-green-100 hover:bg-green-200'}`}
                >
                  Owner Account
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDark ? 'text-gray-400 bg-gray-900' : 'text-gray-500 bg-white'}`}>
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Signup Link */}
            <Link
              to="/signup"
              className={`w-full flex justify-center py-3 px-4 border-2 rounded-lg shadow-sm text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF385C] ${isDark ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700 focus:ring-offset-gray-900' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
            >
              Sign up
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}