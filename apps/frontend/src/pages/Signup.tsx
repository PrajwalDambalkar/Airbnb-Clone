// src/pages/Signup.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'traveler' as 'traveler' | 'owner',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(formData);
      navigate('/'); // Redirect to home after signup
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Title */}
        <h2 className="text-center text-4xl font-bold text-[#FF385C] mb-2">
          airbnb
        </h2>
        <h3 className="text-2xl font-semibold text-center text-gray-900">
          Welcome to Airbnb
        </h3>
        <p className="mt-2 text-sm text-center text-gray-600">
          Create your account to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 py-8 bg-white border border-gray-200 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 text-red-700 border border-red-200 rounded-lg bg-red-50">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'traveler' })}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === 'traveler'
                      ? 'border-[#FF385C] bg-pink-50 text-[#FF385C]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="mb-1 text-2xl">✈️</div>
                  <div className="font-semibold">Travel</div>
                  <div className="text-xs text-gray-500">Find places</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'owner' })}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.role === 'owner'
                      ? 'border-[#FF385C] bg-pink-50 text-[#FF385C]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="mb-1 text-2xl">🏠</div>
                  <div className="font-semibold">Host</div>
                  <div className="text-xs text-gray-500">List property</div>
                </button>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">
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
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF385C] transition-all"
            >
              Log in instead
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}