// src/App.tsx
import type { ReactNode } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Signup from './pages/Signup';
import SignIn from './pages/SignIn';

// Temporary Home component (we'll build the real dashboard later)
function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#FF385C]">airbnb</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{user.name}</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-[#FF385C]">
              {user.role === 'traveler' ? '✈️ Traveler' : '🏠 Owner'}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            🎉 Authentication Working!
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            You're successfully logged in. We'll build the dashboard next!
          </p>

          <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Your Account Info:</h3>
            <dl className="space-y-2 text-left">
              <div className="flex justify-between">
                <dt className="text-gray-600">ID:</dt>
                <dd className="font-semibold">{user.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Name:</dt>
                <dd className="font-semibold">{user.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Email:</dt>
                <dd className="font-semibold">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Role:</dt>
                <dd className="font-semibold capitalize">{user.role}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<SignIn />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;