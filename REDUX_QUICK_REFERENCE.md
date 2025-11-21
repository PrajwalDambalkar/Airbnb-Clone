# Redux Quick Reference Guide

## 🚀 Quick Start

### Import Redux Hooks
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
```

---

## 🔐 Authentication

### Import
```typescript
import { 
  login, 
  signup, 
  logout, 
  checkAuth,
  selectUser, 
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  clearError
} from '../store/slices/authSlice';
```

### Usage
```typescript
const dispatch = useAppDispatch();
const user = useAppSelector(selectUser);
const isAuthenticated = useAppSelector(selectIsAuthenticated);
const loading = useAppSelector(selectAuthLoading);
const error = useAppSelector(selectAuthError);

// Login
await dispatch(login({ email, password })).unwrap();

// Signup
await dispatch(signup({ name, email, password, role })).unwrap();

// Logout
dispatch(logout());

// Check auth on mount
useEffect(() => {
  dispatch(checkAuth());
}, [dispatch]);

// Clear errors
dispatch(clearError());
```

---

## 🏠 Properties

### Import
```typescript
import {
  fetchProperties,
  fetchPropertyById,
  setDestination,
  setGuests,
  applyFilters,
  clearFilters,
  selectProperties,
  selectSelectedProperty,
  selectPropertiesLoading,
  selectPropertiesFilters
} from '../store/slices/propertiesSlice';
```

### Usage
```typescript
const dispatch = useAppDispatch();
const properties = useAppSelector(selectProperties);
const selectedProperty = useAppSelector(selectSelectedProperty);
const loading = useAppSelector(selectPropertiesLoading);
const filters = useAppSelector(selectPropertiesFilters);

// Fetch all properties
dispatch(fetchProperties());

// Fetch with filters
dispatch(fetchProperties({ city: 'Los Angeles', guests: 4 }));

// Fetch single property
dispatch(fetchPropertyById('property-id'));

// Set filters
dispatch(setDestination('Los Angeles'));
dispatch(setGuests('4'));
dispatch(applyFilters());

// Clear filters
dispatch(clearFilters());
```

---

## 📅 Bookings & Favorites

### Import
```typescript
import {
  fetchBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  toggleFavorite,
  loadFavorites,
  selectBookings,
  selectFavorites,
  selectBookingStatus,
  selectBookingsLoading,
  resetBookingStatus
} from '../store/slices/bookingsSlice';
```

### Usage
```typescript
const dispatch = useAppDispatch();
const bookings = useAppSelector(selectBookings);
const favorites = useAppSelector(selectFavorites);
const bookingStatus = useAppSelector(selectBookingStatus);
const loading = useAppSelector(selectBookingsLoading);

// Fetch bookings
dispatch(fetchBookings());
dispatch(fetchBookings('PENDING')); // Filter by status

// Create booking
await dispatch(createBooking({
  property_id: 'property-id',
  check_in_date: '2025-01-01',
  check_out_date: '2025-01-05',
  guests: 2,
  total_price: 500
})).unwrap();

// Update booking status
dispatch(updateBookingStatus({ id: 'booking-id', status: 'ACCEPTED' }));

// Cancel booking
dispatch(cancelBooking({ id: 'booking-id', reason: 'Changed plans' }));

// Load favorites
dispatch(loadFavorites(userId));

// Toggle favorite
dispatch(toggleFavorite({ propertyId: 'property-id', userId: user.id }));

// Reset booking status
dispatch(resetBookingStatus());
```

---

## 🎯 Common Patterns

### Pattern 1: Fetch Data on Mount
```typescript
useEffect(() => {
  dispatch(fetchProperties());
}, [dispatch]);
```

### Pattern 2: Handle Async Actions with Loading/Error
```typescript
const handleSubmit = async () => {
  try {
    await dispatch(createBooking(data)).unwrap();
    navigate('/bookings');
  } catch (err) {
    console.error('Failed:', err);
  }
};
```

### Pattern 3: Conditional Rendering Based on State
```typescript
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <PropertyList properties={properties} />;
```

### Pattern 4: Check if User is Favorite
```typescript
const isFavorite = favorites.includes(propertyId);
```

### Pattern 5: Clear Errors on Mount
```typescript
useEffect(() => {
  dispatch(clearError());
}, [dispatch]);
```

---

## 🔍 Redux DevTools

### Install Browser Extension
- Chrome: https://chrome.google.com/webstore/detail/redux-devtools
- Firefox: https://addons.mozilla.org/firefox/addon/reduxdevtools/

### Features
- View current state
- Inspect dispatched actions
- Time-travel debugging
- Export/import state

---

## 📝 TypeScript Tips

### Type-Safe Selectors
```typescript
// ✅ Good - Type-safe
const user = useAppSelector(selectUser);

// ❌ Bad - Not type-safe
const user = useAppSelector(state => state.auth.user);
```

### Unwrap Async Actions
```typescript
// ✅ Good - Throws error on rejection
await dispatch(login(data)).unwrap();

// ❌ Bad - Doesn't throw
await dispatch(login(data));
```

---

## 🐛 Common Issues

### Issue: "Cannot read property of undefined"
**Solution:** Check if data is loaded before accessing
```typescript
if (!user) return null;
return <div>{user.name}</div>;
```

### Issue: Component not re-rendering
**Solution:** Use selector, not direct state access
```typescript
// ✅ Good
const user = useAppSelector(selectUser);

// ❌ Bad
const user = store.getState().auth.user;
```

### Issue: "Actions must be plain objects"
**Solution:** Use dispatch, not direct action call
```typescript
// ✅ Good
dispatch(login(data));

// ❌ Bad
login(data);
```

---

## 📚 Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux Style Guide](https://redux.js.org/style-guide/)

---

## 🎓 Best Practices

1. **Always use typed hooks** (`useAppDispatch`, `useAppSelector`)
2. **Use selectors** instead of direct state access
3. **Clear errors** when component unmounts or on new actions
4. **Use `.unwrap()`** for async actions when you need to handle errors
5. **Keep actions simple** - complex logic goes in thunks
6. **Use Redux DevTools** for debugging
7. **Normalize data** when storing complex nested structures
8. **Keep state minimal** - derive data in selectors when possible

---

**Last Updated:** November 21, 2025

