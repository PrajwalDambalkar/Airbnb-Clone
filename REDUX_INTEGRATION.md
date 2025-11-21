# Redux Integration Documentation

## Overview

This document describes the Redux state management implementation for the Airbnb Clone application. Redux has been integrated using **Redux Toolkit** to manage:

1. **User Authentication** (JWT/Session tokens)
2. **Property Data** (property lists, details, and search filters)
3. **Booking Data** (bookings, favorites, and booking status)

---

## 📁 File Structure

```
apps/frontend/src/
├── store/
│   ├── index.ts                 # Redux store configuration
│   ├── hooks.ts                 # Typed Redux hooks (useAppDispatch, useAppSelector)
│   └── slices/
│       ├── authSlice.ts        # Authentication state management
│       ├── propertiesSlice.ts  # Property data management
│       └── bookingsSlice.ts    # Bookings & favorites management
├── main.tsx                     # Redux Provider wrapper
└── App.tsx                      # Updated to use Redux for auth
```

---

## 🔧 Installation

Redux Toolkit and React-Redux have been installed:

```bash
npm install @reduxjs/toolkit react-redux
```

---

## 🏗️ Redux Store Configuration

### **File: `store/index.ts`**

The store is configured with three slices:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertiesReducer from './slices/propertiesSlice';
import bookingsReducer from './slices/bookingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    bookings: bookingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 🔐 Authentication Slice

### **File: `store/slices/authSlice.ts`**

Manages user authentication state including login, signup, logout, and session checking.

### **State Structure**

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

### **Async Actions**

- `signup(data)` - Register a new user
- `login(data)` - Authenticate user
- `logout()` - Clear user session
- `checkAuth()` - Verify current session on app load
- `refreshUser()` - Refresh user data

### **Selectors**

- `selectUser` - Get current user
- `selectIsAuthenticated` - Check if user is logged in
- `selectAuthLoading` - Get loading state
- `selectAuthError` - Get error message

### **Usage Example**

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, selectUser, selectAuthError } from '../store/slices/authSlice';

function LoginComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const error = useAppSelector(selectAuthError);

  const handleLogin = async () => {
    try {
      await dispatch(login({ email, password })).unwrap();
      // Success - user is now in Redux state
    } catch (err) {
      // Error is in Redux state
    }
  };
}
```

---

## 🏠 Properties Slice

### **File: `store/slices/propertiesSlice.ts`**

Manages property listings, search filters, and individual property details.

### **State Structure**

```typescript
interface PropertiesState {
  properties: Property[];
  allProperties: Property[];
  selectedProperty: Property | null;
  loading: boolean;
  error: string | null;
  filters: {
    destination: string;
    checkInDate: string;
    checkOutDate: string;
    guests: string;
  };
}
```

### **Async Actions**

- `fetchProperties(filters?)` - Fetch all properties with optional filters
- `fetchPropertyById(id)` - Fetch single property details

### **Sync Actions**

- `setDestination(value)` - Set destination filter
- `setCheckInDate(value)` - Set check-in date
- `setCheckOutDate(value)` - Set check-out date
- `setGuests(value)` - Set number of guests
- `applyFilters()` - Apply current filters to property list
- `clearFilters()` - Reset all filters

### **Selectors**

- `selectProperties` - Get filtered property list
- `selectAllProperties` - Get unfiltered property list
- `selectSelectedProperty` - Get currently selected property
- `selectPropertiesLoading` - Get loading state
- `selectPropertiesFilters` - Get current filter values

### **Usage Example**

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProperties,
  setDestination,
  applyFilters,
  selectProperties,
} from '../store/slices/propertiesSlice';

function HomeComponent() {
  const dispatch = useAppDispatch();
  const properties = useAppSelector(selectProperties);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(setDestination('Los Angeles'));
    dispatch(applyFilters());
  };
}
```

---

## 📅 Bookings Slice

### **File: `store/slices/bookingsSlice.ts`**

Manages user bookings, favorites, and booking status.

### **State Structure**

```typescript
interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  favorites: string[];
  loading: boolean;
  error: string | null;
  bookingStatus: 'idle' | 'pending' | 'success' | 'failed';
}
```

### **Async Actions**

- `fetchBookings(status?)` - Fetch all bookings for logged-in user
- `fetchBookingById(id)` - Fetch single booking details
- `createBooking(data)` - Create a new booking
- `updateBookingStatus({ id, status })` - Update booking status
- `cancelBooking({ id, reason })` - Cancel a booking
- `loadFavorites(userId)` - Load favorites from localStorage

### **Sync Actions**

- `addFavorite({ propertyId, userId })` - Add property to favorites
- `removeFavorite({ propertyId, userId })` - Remove from favorites
- `toggleFavorite({ propertyId, userId })` - Toggle favorite status
- `resetBookingStatus()` - Reset booking creation status

### **Selectors**

- `selectBookings` - Get all bookings
- `selectFavorites` - Get favorite property IDs
- `selectBookingStatus` - Get booking creation status
- `selectBookingsLoading` - Get loading state

### **Usage Example**

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createBooking,
  toggleFavorite,
  selectFavorites,
  selectBookingStatus,
} from '../store/slices/bookingsSlice';
import { selectUser } from '../store/slices/authSlice';

function PropertyDetailComponent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const favorites = useAppSelector(selectFavorites);
  const bookingStatus = useAppSelector(selectBookingStatus);

  const handleBooking = async () => {
    try {
      await dispatch(createBooking({
        property_id: propertyId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests: numberOfGuests,
        total_price: totalPrice,
      })).unwrap();
      // Success
    } catch (err) {
      // Error
    }
  };

  const handleToggleFavorite = () => {
    if (user) {
      dispatch(toggleFavorite({ propertyId, userId: user.id }));
    }
  };
}
```

---

## 🎯 Redux Flow Examples

### **1. Authentication Flow**

```
User logs in
    ↓
dispatch(login({ email, password }))
    ↓
Redux stores user in state.auth.user
    ↓
Components access via useAppSelector(selectUser)
    ↓
User navigates to dashboard
```

### **2. Property Search Flow**

```
App loads
    ↓
dispatch(fetchProperties())
    ↓
Redux stores results in state.properties.properties
    ↓
User enters search criteria
    ↓
dispatch(setDestination('Los Angeles'))
dispatch(setGuests('4'))
dispatch(applyFilters())
    ↓
Filtered results displayed from Redux state
```

### **3. Booking Creation Flow**

```
User selects dates and guests
    ↓
dispatch(createBooking(bookingData))
    ↓
Redux updates state.bookings.bookingStatus = 'pending'
    ↓
API call succeeds
    ↓
Redux updates state.bookings.bookings (adds new booking)
Redux updates state.bookings.bookingStatus = 'success'
    ↓
Component redirects to bookings page
```

### **4. Favorites Management Flow**

```
App loads
    ↓
dispatch(loadFavorites(userId))
    ↓
Redux loads favorites from localStorage
    ↓
User clicks heart icon
    ↓
dispatch(toggleFavorite({ propertyId, userId }))
    ↓
Redux updates state.bookings.favorites
Redux persists to localStorage
Redux dispatches 'favoritesUpdated' event
    ↓
All components using favorites selector update automatically
```

---

## 🔗 Integration with Existing Components

### **App.tsx**

Updated to use Redux instead of AuthContext:

```typescript
function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth()); // Check authentication on app load
  }, [dispatch]);

  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          {/* ... routes */}
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  );
}
```

### **Header Component**

Uses Redux for user and favorites:

```typescript
function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const favorites = useAppSelector(selectFavorites);

  useEffect(() => {
    if (user) {
      dispatch(loadFavorites(user.id));
    }
  }, [user, dispatch]);

  const handleLogout = () => {
    dispatch(logoutAction());
  };
}
```

### **Login/Signup Pages**

Updated to use Redux actions:

```typescript
function Login() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      navigate('/');
    } catch (err) {
      // Error handled by Redux
    }
  };
}
```

---

## 📊 Benefits of Redux Integration

### **1. Centralized State Management**
- All application state in one place
- Easy to debug with Redux DevTools
- Predictable state updates

### **2. Better Performance**
- Components only re-render when their selected state changes
- Efficient state updates with Immer (built into Redux Toolkit)
- Memoized selectors prevent unnecessary recalculations

### **3. Improved Developer Experience**
- TypeScript support out of the box
- Less boilerplate with Redux Toolkit
- Built-in async handling with createAsyncThunk

### **4. Easier Testing**
- Pure reducer functions are easy to test
- Actions can be tested independently
- Mock store for component testing

### **5. Scalability**
- Easy to add new slices as app grows
- Middleware support for advanced features
- Can integrate with Redux DevTools for time-travel debugging

---

## 🛠️ Redux DevTools

Install the Redux DevTools browser extension to inspect state changes:

- **Chrome**: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- **Firefox**: [Redux DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Once installed, you can:
- View current state
- Inspect actions
- Time-travel through state changes
- Export/import state snapshots

---

## 🚀 Next Steps

### **Components to Update**

The following components should be updated to use Redux:

1. **Home.tsx** - Use `fetchProperties` and property selectors
2. **PropertyDetail.tsx** - Use `fetchPropertyById` and `createBooking`
3. **Favorites.tsx** - Use `selectFavorites` and property data
4. **Bookings.tsx** - Use `fetchBookings` and booking selectors
5. **OwnerDashboard.tsx** - Can use Redux for owner's properties
6. **OwnerBookings.tsx** - Use Redux for owner's booking management

### **Additional Features**

Consider adding:
- Optimistic updates for better UX
- Caching strategies for API calls
- Pagination for large datasets
- Real-time updates with WebSockets
- Persistent state with redux-persist

---

## 📝 Summary

Redux has been successfully integrated into the Airbnb Clone application with:

✅ **Authentication State Management** - User sessions, login, signup, logout  
✅ **Property Data Management** - Property lists, details, search filters  
✅ **Booking State Management** - Bookings, favorites, booking status  
✅ **Typed Redux Hooks** - Type-safe useAppDispatch and useAppSelector  
✅ **Redux Store Configuration** - Centralized state with three slices  
✅ **Updated Components** - App.tsx, Login.tsx, Signup.tsx using Redux  

The implementation follows Redux Toolkit best practices and provides a solid foundation for scaling the application.

---

## 📚 Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Documentation](https://react-redux.js.org/)
- [Redux Style Guide](https://redux.js.org/style-guide/style-guide)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

