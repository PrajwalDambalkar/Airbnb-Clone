// src/App.tsx
import type { ReactNode } from 'react';
import { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Bookings from './pages/Bookings';
import PropertyDetail from './pages/PropertyDetail';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerBookings from './pages/OwnerBookings';
import AddProperty from './pages/AddProperty';
import { Moon, Sun, Heart, Home as HomeIcon, Calendar, ChevronDown, Settings, LogOut } from 'lucide-react';

// Dark Mode Context
interface DarkModeContextType {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
};

// Header Component
function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [favCount, setFavCount] = useState<number>(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Load favourites count from localStorage
  useEffect(() => {
    const loadFavs = () => {
      try {
        const raw = localStorage.getItem('favorites');
        const arr = raw ? JSON.parse(raw) : [];
        setFavCount(Array.isArray(arr) ? arr.length : 0);
      } catch (e) {
        setFavCount(0);
      }
    };

    loadFavs();

    // Listen for cross-tab or app-level updates
    const handler = () => loadFavs();
    window.addEventListener('storage', handler);
    window.addEventListener('favoritesUpdated', handler as EventListener);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('favoritesUpdated', handler as EventListener);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileMenu]);

  if (!user) return null;

  return (
    <header className={`sticky top-0 z-[10001] overflow-visible ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm transition-colors`}>
      <div className={`flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-bold hover:opacity-80 transition-opacity ${isDark ? 'text-white' : 'text-[#FF385C]'}`}
        >
          airbnb
        </button>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome, <span className="font-semibold">{user.name}</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-[#FF385C]'}`}>
            {user.role === 'traveler' ? '✈️ Traveler' : '🏠 Owner'}
          </span>
          
          {/* Owner-specific button */}
          {user.role === 'owner' && (
            <Link 
              to="/owner/dashboard" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-[#FF385C] text-white hover:bg-[#E31C5F]' : 'bg-[#FF385C] text-white hover:bg-[#E31C5F]'}`}
            >
              <HomeIcon size={16} />
              <span>Manage Properties</span>
            </Link>
          )}
          
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative profile-dropdown z-[10000]">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' : 'bg-white hover:bg-gray-50 border border-gray-300'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={16} className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden z-[10000] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                </div>
                
                <div className="py-1">
                  <Link
                    to="/favorites"
                    onClick={() => setShowProfileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Heart size={16} className="text-[#FF385C]" />
                    <span>Favourites</span>
                    {favCount > 0 && (
                      <span className="ml-auto inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{favCount}</span>
                    )}
                  </Link>
                  
                  <Link
                    to="/bookings"
                    onClick={() => setShowProfileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Calendar size={16} className="text-[#FF385C]" />
                    <span>Bookings</span>
                  </Link>
                  
                  <button
                    disabled
                    className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left cursor-not-allowed opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                  >
                    <Settings size={16} />
                    <span>Edit Profile</span>
                    <span className="ml-auto text-xs">(Soon)</span>
                  </button>
                </div>

                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left transition-colors ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isDark } = useDarkMode();
  const location = window.location.pathname;
  const isOwnerRoute = location.startsWith('/owner');

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C] mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Only show global header for traveler routes, owner routes have their own header */}
      {!isOwnerRoute && <Header />}
      {children}
    </>
  );
}

// Dark Mode Provider
function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    // Get dark mode preference from localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Owner Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties/new"
              element={
                <ProtectedRoute>
                  <AddProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <ProtectedRoute>
                  <OwnerBookings />
                </ProtectedRoute>
              }
            />
            
            {/* Traveler/Public Routes */}
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/property/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
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
    </DarkModeProvider>
  );
}

export default App;

// // src/App.tsx
// import type { ReactNode } from 'react';

// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Signup from './pages/Signup';
// import Login from './pages/Login';

// // Temporary Home component (we'll build the real dashboard later)
// function Home() {
//   const { user, logout, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C] mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Simple Header */}
//       <header className="bg-white border-b shadow-sm">
//         <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
//           <h1 className="text-2xl font-bold text-[#FF385C]">airbnb</h1>
//           <div className="flex items-center gap-4">
//             <span className="text-sm text-gray-600">
//               Welcome, <span className="font-semibold">{user.name}</span>
//             </span>
//             <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-[#FF385C]">
//               {user.role === 'traveler' ? '✈️ Traveler' : '🏠 Owner'}
//             </span>
//             <button
//               onClick={logout}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
//         <div className="text-center">
//           <h2 className="mb-4 text-3xl font-bold text-gray-900">
//             🎉 Authentication Working!
//           </h2>
//           <p className="mb-8 text-lg text-gray-600">
//             You're successfully logged in. We'll build the dashboard next!
//           </p>

//           <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-lg">
//             <h3 className="mb-4 text-lg font-semibold">Your Account Info:</h3>
//             <dl className="space-y-2 text-left">
//               <div className="flex justify-between">
//                 <dt className="text-gray-600">ID:</dt>
//                 <dd className="font-semibold">{user.id}</dd>
//               </div>
//               <div className="flex justify-between">
//                 <dt className="text-gray-600">Name:</dt>
//                 <dd className="font-semibold">{user.name}</dd>
//               </div>
//               <div className="flex justify-between">
//                 <dt className="text-gray-600">Email:</dt>
//                 <dd className="font-semibold">{user.email}</dd>
//               </div>
//               <div className="flex justify-between">
//                 <dt className="text-gray-600">Role:</dt>
//                 <dd className="font-semibold capitalize">{user.role}</dd>
//               </div>
//             </dl>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// // Protected Route wrapper
// function ProtectedRoute({ children }: { children: ReactNode }) {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   return <>{children}</>;
// }

// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/login" element={<Login />} />
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <Home />
//               </ProtectedRoute>
//             }
//           />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;