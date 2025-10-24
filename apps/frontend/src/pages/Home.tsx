import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { useDarkMode } from '../App';
import type { Property } from '../types/property';
import { getFirstImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [guests, setGuests] = useState<string>('');
    const [checkInDate, setCheckInDate] = useState<string>('');
    const [checkOutDate, setCheckOutDate] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [showDestinations, setShowDestinations] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 9)); // October 2025
    const [dateMode, setDateMode] = useState<'Dates' | 'Months' | 'Flexible'>('Dates');
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const { isDark } = useDarkMode();
    const [favorites, setFavorites] = useState<Set<number>>(() => {
        try {
            const raw = localStorage.getItem('favorites');
            const arr: number[] = raw ? JSON.parse(raw) : [];
            return new Set(arr);
        } catch (e) {
            return new Set();
        }
    
    });
    const laCarouselRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const sdCarouselRef = useRef<HTMLDivElement>(null);
    const destinationDropdownRef = useRef<HTMLDivElement>(null);
    
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = (date: Date) => {
        const daysInMonth = getDaysInMonth(date);
        const firstDay = getFirstDayOfMonth(date);
        const days = [];
        
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        
        return days;
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateSelect = (day: number) => {
        if (!day) return;
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = selectedDate.toISOString().split('T')[0];
        
        if (!checkInDate) {
            setCheckInDate(dateString);
        } else if (!checkOutDate) {
            if (dateString > checkInDate) {
                setCheckOutDate(dateString);
                // Close calendar after selecting checkout date
                setShowCalendar(false);
            } else {
                setCheckInDate(dateString);
            }
        } else {
            setCheckInDate(dateString);
            setCheckOutDate('');
        }
    };

    const handleFlexibleDates = (days: number) => {
        if (!checkInDate) return;
        
        const startDate = new Date(checkInDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);
        
        setCheckOutDate(endDate.toISOString().split('T')[0]);
    };

    const suggestedDestinations = [
        { name: 'Nearby', description: "Find what's around you", icon: '📍' },
        { name: 'Lake Tahoe', description: 'Popular lake destination', icon: '🏔️' },
        { name: 'San Diego, CA', description: 'For sights like Balboa Park', icon: '🏛️' },
        { name: 'Los Angeles, CA', description: "For it's bustling nightlife", icon: '🌉' },
        { name: 'South Lake Tahoe, CA', description: 'For nature-lovers', icon: '🏠' },
        { name: 'Las Vegas, NV', description: "For it's top-notch dining", icon: '🎰' },
        { name: 'San Francisco, CA', description: 'For sights like Golden Gate Bridge', icon: '🌁' },
        { name: 'Miami, FL', description: 'Beach getaway destination', icon: '🏖️' },
        { name: 'New York, NY', description: 'The city that never sleeps', icon: '🗽' },
        { name: 'Chicago, IL', description: 'Windy City experiences', icon: '🌆' },
        { name: 'Denver, CO', description: 'Mountain adventures await', icon: '⛰️' },
        { name: 'Austin, TX', description: 'Live Music Capital', icon: '🎸' },
        { name: 'Seattle, WA', description: 'Coffee and tech hub', icon: '☕' },
        { name: 'Portland, OR', description: 'Hip and quirky vibes', icon: '🌲' },
        { name: 'Boston, MA', description: 'Historic charm and culture', icon: '🏰' },
        { name: 'Sedona, AZ', description: 'Red rock formations', icon: '🏜️' },
        { name: 'Aspen, CO', description: 'Luxury mountain resort', icon: '⛷️' },
        { name: 'Hawaii, HI', description: 'Tropical paradise', icon: '🌺' },
        { name: 'New Orleans, LA', description: 'Jazz and culture', icon: '🎺' },
        { name: 'Paris, France', description: 'City of lights', icon: '🗼' }
    ];

    useEffect(() => {
        fetchProperties();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(event.target as Node)) {
                setShowDestinations(false);
            }
        };

        if (showDestinations) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDestinations]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const response = await propertyService.getAllProperties();
            console.log('🔍 API Response:', response);
            console.log('🖼️ First property images:', response.data?.[0]?.images);
            console.log('🖼️ Images type:', typeof response.data?.[0]?.images);
            setProperties(response.data || []);
            setAllProperties(response.data || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowDestinations(false);
        
        console.log('🔍 Search triggered with:', { destination, checkInDate, checkOutDate, guests });
        
        let filtered = [...allProperties];

        // Filter by destination/city
        if (destination) {
            filtered = filtered.filter(p => 
                p.city.toLowerCase().includes(destination.toLowerCase())
            );
        }

        // Filter properties based on guests
        if (guests) {
            const guestCount = parseInt(guests);
            filtered = filtered.filter(p => p.max_guests >= guestCount);
        }

        // Filter by dates (optional - only if both dates are set)
        if (checkInDate && checkOutDate) {
            console.log('📅 Filtering by date range:', checkInDate, 'to', checkOutDate);
            // Add date filtering logic here when booking system is ready
        }

        console.log('✅ Filtered results:', filtered.length, 'properties');
        setProperties(filtered);
    };

    const handleDestinationSelect = (dest: string) => {
        setDestination(dest);
        setShowDestinations(false);
    };

    const handleReset = () => {
        setGuests('');
        setCheckInDate('');
        setCheckOutDate('');
        setDestination('');
        setShowDestinations(false);
        fetchProperties();
    };

    const scrollCarousel = (ref: any, direction: 'left' | 'right') => {
        if (ref?.current) {
            const scrollAmount = 320; // Card width (300px) + gap (20px)
            if (direction === 'left') {
                ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const toggleFavorite = (propertyId: number) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(propertyId)) {
                newFavorites.delete(propertyId);
            } else {
                newFavorites.add(propertyId);
            }

            // persist to localStorage as array of ids
            try {
                const arr = Array.from(newFavorites.values());
                localStorage.setItem('favorites', JSON.stringify(arr));
                // notify other listeners in the app
                window.dispatchEvent(new Event('favoritesUpdated'));
            } catch (e) {
                console.error('Failed to persist favorites', e);
            }

            return newFavorites;
        });
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'} transition-colors`}>
            {/* Welcome Section */}
            <section className="px-4 pt-6 sm:pt-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className={`text-2xl sm:text-4xl font-bold break-words leading-tight ${isDark ? 'text-white' : 'text-gray-900'} text-center sm:text-left`}>
                        Welcome back, {user?.name || 'Guest'}! <span role="img" aria-label="wave">👋</span>
                    </h1>
                    <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center sm:text-left`}>
                        Find your next stay or manage your properties from here.
                    </p>
                </div>
            </section>
            {/* Premium Search Bar */}
            <div className={`${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-white'} py-12 relative shadow-sm z-[1000]`}>
                <div className="px-4 mx-auto max-w-5xl relative z-[1001]">
                    <form onSubmit={handleSearch}>
                        <div className={`flex items-center gap-0 ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'} rounded-full shadow-2xl border hover:shadow-3xl transition-all duration-300 backdrop-blur-sm relative z-[1002]`}>
                            {/* Where - Location */}
                            <div ref={destinationDropdownRef} className={`flex-1 px-6 py-4 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} relative`}>
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Where</div>
                                <input
                                    type="text"
                                    placeholder="Search destinations"
                                    value={destination}
                                    onChange={(e) => {
                                        setDestination(e.target.value);
                                        setShowDestinations(true);
                                    }}
                                    onFocus={() => setShowDestinations(true)}
                                    className={`w-full bg-transparent ${isDark ? 'text-gray-300 placeholder-gray-500' : 'text-gray-600 placeholder-gray-400'} focus:outline-none text-base`}
                                />

                                {/* Suggested Destinations Dropdown */}
                                {showDestinations && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border z-[9999] w-96 max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="p-6">
                                            <h3 className={`text-lg font-semibold mb-4 sticky top-0 pb-2 ${isDark ? 'text-gray-100 bg-gray-800' : 'text-gray-900 bg-white'}`}>Suggested destinations</h3>
                                            <div className="space-y-3">
                                                {suggestedDestinations.map((dest, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleDestinationSelect(dest.name)}
                                                        className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors text-left ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    >
                                                        <div className="flex-shrink-0 text-3xl">{dest.icon}</div>
                                                        <div>
                                                            <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{dest.name}</div>
                                                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{dest.description}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* When - Check-in/Checkout with Calendar */}
                            <div className={`flex-1 px-6 py-4 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} relative cursor-pointer`}>
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>When</div>
                                <button
                                    type="button"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className={`w-full bg-transparent focus:outline-none text-base text-left ${isDark ? 'text-gray-300 placeholder-gray-500' : 'text-gray-600 placeholder-gray-400'}`}
                                >
                                    {checkInDate && checkOutDate 
                                        ? `${checkInDate} to ${checkOutDate}`
                                        : checkInDate 
                                        ? `From ${checkInDate}`
                                        : 'Add dates'}
                                </button>

                                {/* Calendar Picker */}
                                {showCalendar && (
                                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] p-6 w-full" style={{ width: '900px', marginLeft: '-200px' }}>
                                        {/* Date Mode Tabs */}
                                        <div className="flex gap-2 mb-6">
                                            <button
                                                type="button"
                                                onClick={() => setDateMode('Dates')}
                                                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                                    dateMode === 'Dates' 
                                                        ? 'bg-white border-2 border-gray-900' 
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                Dates
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDateMode('Months')}
                                                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                                    dateMode === 'Months' 
                                                        ? 'bg-white border-2 border-gray-900' 
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                Months
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDateMode('Flexible')}
                                                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                                    dateMode === 'Flexible' 
                                                        ? 'bg-white border-2 border-gray-900' 
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                Flexible
                                            </button>
                                        </div>

                                        {/* Calendar Grid */}
                                        <div className="flex gap-8 mb-6">
                                            {/* Month 1 */}
                                            <div className="flex-1">
                                                <div className="mb-4 text-lg font-semibold">
                                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-medium text-center text-gray-600">
                                                    <div>S</div>
                                                    <div>M</div>
                                                    <div>T</div>
                                                    <div>W</div>
                                                    <div>T</div>
                                                    <div>F</div>
                                                    <div>S</div>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {generateCalendarDays(currentMonth).map((day, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => day && handleDateSelect(day)}
                                                            className={`p-2 text-sm rounded-lg transition-colors ${
                                                                day === null 
                                                                    ? 'text-gray-300' 
                                                                    : checkInDate && checkOutDate
                                                                    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) >= new Date(checkInDate) &&
                                                                      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) <= new Date(checkOutDate)
                                                                        ? 'bg-red-200 text-gray-900'
                                                                        : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0] === checkInDate ||
                                                                          new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0] === checkOutDate
                                                                        ? 'bg-gray-900 text-white'
                                                                        : 'hover:bg-gray-100'
                                                                    : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0] === checkInDate
                                                                    ? 'bg-gray-900 text-white'
                                                                    : 'hover:bg-gray-100'
                                                            }`}
                                                            disabled={day === null}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Month 2 */}
                                            <div className="flex-1">
                                                <div className="mb-4 text-lg font-semibold">
                                                    {new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-medium text-center text-gray-600">
                                                    <div>S</div>
                                                    <div>M</div>
                                                    <div>T</div>
                                                    <div>W</div>
                                                    <div>T</div>
                                                    <div>F</div>
                                                    <div>S</div>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2">
                                                    {generateCalendarDays(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)).map((day, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => day && handleDateSelect(day)}
                                                            className={`p-2 text-sm rounded-lg transition-colors ${
                                                                day === null 
                                                                    ? 'text-gray-300' 
                                                                    : checkInDate && checkOutDate
                                                                    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day) >= new Date(checkInDate) &&
                                                                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day) <= new Date(checkOutDate)
                                                                        ? 'bg-red-200 text-gray-900'
                                                                        : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day).toISOString().split('T')[0] === checkInDate ||
                                                                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day).toISOString().split('T')[0] === checkOutDate
                                                                        ? 'bg-gray-900 text-white'
                                                                        : 'hover:bg-gray-100'
                                                                    : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day).toISOString().split('T')[0] === checkInDate
                                                                    ? 'bg-gray-900 text-white'
                                                                    : 'hover:bg-gray-100'
                                                            }`}
                                                            disabled={day === null}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation Arrow */}
                                            <button
                                                type="button"
                                                onClick={handleNextMonth}
                                                className="self-center text-xl font-semibold"
                                            >
                                                ›
                                            </button>
                                        </div>

                                        {/* Quick Select Buttons */}
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Exact dates - no action needed, just confirm selection
                                                    setShowCalendar(false);
                                                }}
                                                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                                    !checkInDate || !checkOutDate
                                                        ? 'border-2 border-gray-900 text-gray-900 hover:bg-gray-100'
                                                        : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                                                }`}
                                            >
                                                Exact dates
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFlexibleDates(1)}
                                                disabled={!checkInDate}
                                                className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-full hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                + 1 day
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFlexibleDates(2)}
                                                disabled={!checkInDate}
                                                className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-full hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                + 2 days
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFlexibleDates(3)}
                                                disabled={!checkInDate}
                                                className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-full hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                + 3 days
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFlexibleDates(7)}
                                                disabled={!checkInDate}
                                                className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-full hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                + 7 days
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFlexibleDates(14)}
                                                disabled={!checkInDate}
                                                className="px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-full hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                + 14 days
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Who - Guests */}
                            <div className={`flex-1 px-6 py-4 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} relative`}>
                                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Who</div>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(e.target.value)}
                                    className={`w-full bg-transparent focus:outline-none text-base appearance-none cursor-pointer ${isDark ? 'text-gray-300 placeholder-gray-500' : 'text-gray-600 placeholder-gray-400'}`}
                                >
                                    <option value="" className={isDark ? 'bg-gray-800 text-gray-400' : 'text-gray-400'}>Add guests</option>
                                    <option value="1" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>1 Guest</option>
                                    <option value="2" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>2 Guests</option>
                                    <option value="3" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>3 Guests</option>
                                    <option value="4" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>4 Guests</option>
                                    <option value="5" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>5 Guests</option>
                                    <option value="6" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>6 Guests</option>
                                    <option value="8" className={isDark ? 'bg-gray-800 text-gray-300' : ''}>8+ Guests</option>
                                </select>
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                className="flex-shrink-0 mr-3 p-3 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white rounded-full hover:shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer z-10 relative font-bold"
                                title="Click to search"
                            >
                                🔍
                            </button>
                        </div>
                    </form>

                    {/* Reset Button */}
                    {(checkInDate || checkOutDate || guests || destination) && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleReset}
                                className="text-sm text-gray-600 underline hover:text-gray-900"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="py-12">
                {/* Los Angeles Section */}
                <section className="mb-16">
                    <div className="px-4 mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-3xl font-bold bg-gradient-to-r from-[#FF385C] to-[#E31C5F] bg-clip-text text-transparent ${isDark ? '' : ''}`}>
                                ✨ Popular homes in Los Angeles
                            </h2>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => scrollCarousel(laCarouselRef, 'left')}
                                    className={`p-2.5 rounded-full border-2 transition-all duration-300 hover:scale-110 font-bold text-lg ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-[#FF385C] hover:border-[#FF385C]'}`}
                                    title="Scroll left"
                                >
                                    ←
                                </button>
                                <button 
                                    onClick={() => scrollCarousel(laCarouselRef, 'right')}
                                    className={`p-2.5 rounded-full border-2 transition-all duration-300 hover:scale-110 font-bold text-lg ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-[#FF385C] hover:border-[#FF385C]'}`}
                                    title="Scroll right"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div ref={laCarouselRef} className="flex gap-6 px-4 pb-4 -mx-4 overflow-x-auto scroll-smooth">
                            {properties.map((property) => (
                                <Link
                                    key={property.id}
                                    to={`/property/${property.id}`}
                                    className="flex-none group"
                                >
                                    <div className={`overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-lg w-[300px] ${isDark ? 'bg-gray-800' : 'bg-white'}`}> 
                                        {/* Property Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={getFirstImage(property.images)}
                                                alt={property.property_name}
                                                className="object-cover w-full h-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (!target.dataset.errorHandled) {
                                                        target.dataset.errorHandled = 'true';
                                                        target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                                    }
                                                }}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                                        property.available
                                                            ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                                                            : isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {property.available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(property.id);
                                                }}
                                                className={`absolute top-2 left-2 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
                                                    favorites.has(property.id) 
                                                        ? 'bg-red-500/80 shadow-lg' 
                                                        : 'bg-white/70 hover:bg-white'
                                                }`}
                                            >
                                                <Heart 
                                                    className={`w-5 h-5 transition-all duration-300 ${favorites.has(property.id) ? 'fill-white stroke-white' : 'stroke-gray-900'}`}
                                                />
                                            </button>
                                        </div>
                                        {/* Property Details */}
                                        <div className="p-4">
                                            <h3 className={`text-lg font-semibold truncate group-hover:text-[#FF385C] transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}> 
                                                {property.property_name}
                                            </h3>
                                            <div className={`flex items-center gap-1 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> 
                                                <span>⭐ {(property.rating || 4.5).toFixed(2)}</span>
                                                <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({Math.floor(Math.random() * 200) + 50} reviews)</span>
                                            </div>
                                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}> 
                                                {property.city}, {property.state}
                                            </p>
                                            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}> 
                                                {property.bedrooms} bed • {property.bathrooms} bath • {property.max_guests} guests
                                            </p>
                                            <p className={`mt-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}> 
                                                ${property.price_per_night}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* San Diego Section */}
                <section className="mb-16">
                    <div className="px-4 mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-3xl font-bold bg-gradient-to-r from-[#FF385C] to-[#E31C5F] bg-clip-text text-transparent`}>
                                🌴 Available next month in San Diego
                            </h2>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => scrollCarousel(sdCarouselRef, 'left')}
                                    className={`p-2.5 rounded-full border-2 transition-all duration-300 hover:scale-110 font-bold text-lg ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-[#FF385C] hover:border-[#FF385C]'}`}
                                    title="Scroll left"
                                >
                                    ←
                                </button>
                                <button 
                                    onClick={() => scrollCarousel(sdCarouselRef, 'right')}
                                    className={`p-2.5 rounded-full border-2 transition-all duration-300 hover:scale-110 font-bold text-lg ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-[#FF385C] hover:border-[#FF385C]'}`}
                                    title="Scroll right"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div ref={sdCarouselRef} className="flex gap-6 px-4 pb-4 -mx-4 overflow-x-auto scroll-smooth">
                            {properties.filter(p => p.city.toLowerCase() === 'san diego').map((property) => (
                                <Link
                                    key={property.id}
                                    to={`/property/${property.id}`}
                                    className="flex-none group"
                                >
                                    <div className="w-[300px] transition-all duration-300 hover:scale-105">
                                        <div className="relative aspect-[4/3] mb-4 overflow-hidden">
                                            <img
                                                src={getFirstImage(property.images)}
                                                alt={property.property_name}
                                                className="object-cover w-full h-full transition-all duration-300 shadow-lg rounded-2xl group-hover:shadow-2xl group-hover:brightness-110"
                                                onError={(e) => {
                                                    console.error('❌ SD Image failed:', property.images?.[0]);
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3';
                                                }}
                                            />
                                            <div className="absolute px-3 py-1 text-xs font-bold text-gray-900 rounded-full shadow-md top-3 left-3 bg-white/90 backdrop-blur-md">
                                                ⭐ Guest favorite
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(property.id);
                                                }}
                                                className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
                                                    favorites.has(property.id) 
                                                        ? 'bg-red-500/80 shadow-lg' 
                                                        : 'bg-white/70 hover:bg-white'
                                                }`}
                                            >
                                                <Heart 
                                                    className={`w-5 h-5 transition-all duration-300 ${favorites.has(property.id) ? 'fill-white stroke-white' : 'stroke-gray-900'}`}
                                                />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className={`font-bold text-lg truncate group-hover:text-[#FF385C] transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                {property.property_name}
                                            </h3>
                                            <div className={`flex items-center gap-1 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                <span>⭐ {(property.rating || 4.5).toFixed(2)}</span>
                                                <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>({Math.floor(Math.random() * 200) + 50} reviews)</span>
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {property.city}, {property.state}
                                            </div>
                                            <div className="flex items-baseline gap-1 pt-2">
                                                <span className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                    ${property.price_per_night}
                                                </span>
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    /night
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
                {/* Loading State */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-16 h-16 border-t-4 border-b-4 border-red-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg text-gray-600">Loading amazing properties...</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="mb-4 text-3xl text-gray-500">😔 No properties found</p>
                        <p className="mb-6 text-gray-400">Try adjusting your search filters</p>
                    </div>
                ) : null}

                {/* Tokyo Section Placeholder */}
                <section className="mb-12">
                    <div className="px-4 mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-3xl font-bold bg-gradient-to-r from-[#FF385C] to-[#E31C5F] bg-clip-text text-transparent`}>
                                Stay in Tokyo
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-2 border rounded-full hover:bg-gray-100">←</button>
                                <button className="p-2 border rounded-full hover:bg-gray-100">→</button>
                            </div>
                        </div>

                        <p className="text-gray-500">Coming soon...</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-20 bg-gray-100 border-t">
                <div className="px-4 py-12 mx-auto max-w-7xl">
                    {/* Footer Links Grid */}
                    <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-4">
                        {/* Support */}
                        <div>
                            <h3 className="mb-4 font-semibold text-gray-900">Support</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Help Center</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Get help with a safety issue</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">AirCover</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Anti-discrimination</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Disability support</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Cancellation options</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Report neighborhood concern</a></li>
                            </ul>
                        </div>

                        {/* Hosting */}
                        <div>
                            <h3 className="mb-4 font-semibold text-gray-900">Hosting</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Airbnb your home</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Airbnb your experience</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Airbnb your service</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">AirCover for Hosts</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Hosting resources</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Community forum</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Hosting responsibly</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Airbnb-friendly apartments</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Join a free Hosting class</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Find a co-host</a></li>
                            </ul>
                        </div>

                        {/* Airbnb */}
                        <div>
                            <h3 className="mb-4 font-semibold text-gray-900">Airbnb</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">2025 Summer Release</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Newsroom</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Careers</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Investors</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Gift cards</a></li>
                                <li><a href="#" className="text-sm text-gray-700 hover:text-gray-900">Airbnb.org emergency stays</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="flex flex-col items-center justify-between gap-6 pt-8 border-t md:flex-row">
                        <div className="text-sm text-center text-gray-600 md:text-left">
                            © 2025 Airbnb, Inc. · 
                            <a href="#" className="mx-1 hover:underline">Terms</a>
                            <a href="#" className="mx-1 hover:underline">Sitemap</a>
                            <a href="#" className="mx-1 hover:underline">Privacy</a>
                            <a href="#" className="mx-1 hover:underline">Your Privacy Choices</a>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                                🌐 English (US)
                            </button>
                            <button className="text-sm text-gray-700 hover:text-gray-900">$ USD</button>
                            <a href="#" className="text-gray-700 hover:text-gray-900">f</a>
                            <a href="#" className="text-gray-700 hover:text-gray-900">𝕏</a>
                            <a href="#" className="text-gray-700 hover:text-gray-900">📷</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}