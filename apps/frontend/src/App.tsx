// src/App.tsx
import type { ReactNode } from 'react';
import { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import PropertyDetail from './pages/PropertyDetail';
import Bookings from './pages/Bookings';
import { Moon, Sun, Heart, Calendar } from 'lucide-react';

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

  if (!user) return null;

  return (
    <header className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm transition-colors`}>
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
          <Link to="/favorites" title="Favourites" className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <Heart size={16} className="text-[#FF385C]" />
            <span className="font-medium">Favourites</span>
            <span className="ml-1 inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{favCount}</span>
          </Link>
          <Link to="/bookings" title="My Bookings" className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
            <Calendar size={16} className="text-[#FF385C]" />
            <span className="font-medium">Bookings</span>
          </Link>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={logout}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg border ${isDark ? 'text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isDark } = useDarkMode();

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
      <Header />
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
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
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