// components/AIAgentSidebar.tsx
import { useState } from 'react';
import { X, Sparkles, Send, Loader2, ChevronDown, ChevronUp, MapPin, Calendar, DollarSign, Utensils, Sun } from 'lucide-react';
import { useDarkMode } from '../App';
import agentService, { type AgentPlanResponse, type DayPlan } from '../services/agentService';

interface AIAgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  bookingDetails?: {
    property_name: string;
    city: string;
    state: string;
    check_in: string;
    check_out: string;
    number_of_guests: number;
  };
}

export default function AIAgentSidebar({ isOpen, onClose, bookingId, bookingDetails }: AIAgentSidebarProps) {
  const { isDark } = useDarkMode();
  
  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AgentPlanResponse | null>(null);
  
  // Preferences state
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    budget: 'medium',
    interests: [] as string[],
    dietary_restrictions: [] as string[],
    mobility_needs: {
      wheelchair: false,
      child_friendly: false
    }
  });
  
  // Expandable sections
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showActivities, setShowActivities] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showPacking, setShowPacking] = useState(true);

  const handleGeneratePlan = async () => {
    console.log('🚀 handleGeneratePlan called');
    console.log('📋 Booking ID:', bookingId);
    console.log('📍 Booking Details:', bookingDetails);
    console.log('💬 Query:', query);
    console.log('⚙️ Preferences:', preferences);
    
    if (!bookingId || bookingId === 0) {
      console.error('❌ Invalid booking ID:', bookingId);
      setError('❌ No booking selected. Booking ID is ' + bookingId);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Calling agent service with:', {
        booking_id: bookingId,
        query: query || undefined,
        preferences: preferences
      });
      
      const response = await agentService.generatePlan({
        booking_id: bookingId,
        query: query || undefined,
        preferences: preferences
      });
      
      console.log('✅ Agent service response:', response);
      setPlan(response);
    } catch (err: any) {
      console.error('❌ Plan generation error:', err);
      console.error('Error details:', {
        code: err.code,
        status: err.response?.status,
        message: err.response?.data?.message,
        fullError: err
      });
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to generate travel plan.';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to AI service. Please ensure the agent service is running on port 8000.';
      } else if (err.response?.status === 503) {
        errorMessage = '🤖 AI service is not available. Please start the agent service and try again.';
      } else if (err.response?.status === 504) {
        errorMessage = '⏱️ Request timed out. The AI is taking longer than expected. This usually happens on first request - please try again.';
      } else if (err.response?.status === 404) {
        errorMessage = '📋 Booking not found. Please ensure you have a valid booking. (Booking ID: ' + bookingId + ')';
      } else if (err.response?.status === 403) {
        errorMessage = '🔒 Authentication error. Please refresh the page and try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleDietary = (diet: string) => {
    setPreferences(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(diet)
        ? prev.dietary_restrictions.filter(d => d !== diet)
        : [...prev.dietary_restrictions, diet]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl z-[9999] overflow-y-auto transition-transform`}
      >
        {/* Header */}
        <div className={`sticky top-0 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 flex items-center justify-between z-10`}>
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#FF385C]" size={24} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Travel Planner
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={24} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <div className="p-6 space-y-6">
        {/* No Bookings Message */}
        {!bookingDetails && bookingId === 0 && (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border-2`}>
            <div className="text-center space-y-4">
              <div className="text-6xl">✈️</div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                No Active Bookings
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                To use the AI Travel Planner, you need to have an active booking first.
              </p>
              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} text-left`}>
                <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  How to get started:
                </p>
                <ol className={`text-sm space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li className="flex items-start">
                    <span className="mr-2">1️⃣</span>
                    <span>Browse properties on the home page</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2️⃣</span>
                    <span>Select a property and create a booking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3️⃣</span>
                    <span>Wait for the owner to accept your booking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4️⃣</span>
                    <span>Come back here to plan your perfect trip! 🎉</span>
                  </li>
                </ol>
              </div>
              <button
                onClick={onClose}
                className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-[#FF385C] hover:bg-[#E31C5F] text-white'
                }`}
              >
                Browse Properties
              </button>
            </div>
          </div>
        )}

        {/* Booking Info */}
        {bookingDetails && (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Booking
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <MapPin size={14} className="inline mr-1" />
              {bookingDetails.city}, {bookingDetails.state}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Calendar size={14} className="inline mr-1" />
              {new Date(bookingDetails.check_in).toLocaleDateString()} - {new Date(bookingDetails.check_out).toLocaleDateString()}
            </p>
          </div>
        )}

          {/* Query Input - Only show if there's a booking */}
          {bookingDetails && (
          <>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Tell us about your trip
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., We're a family with two kids, vegan diet, love outdoor activities..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-[#FF385C] focus:border-transparent`}
            />
          </div>

          {/* Preferences Toggle */}
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className={`w-full flex items-center justify-between p-3 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
            } transition-colors`}
          >
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Advanced Preferences
            </span>
            {showPreferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Preferences Form */}
          {showPreferences && (
            <div className="space-y-4">
              {/* Budget */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Budget
                </label>
                <select
                  value={preferences.budget}
                  onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="low">Budget-friendly</option>
                  <option value="medium">Moderate</option>
                  <option value="high">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {['adventure', 'food', 'culture', 'relaxation', 'nightlife', 'nature', 'shopping'].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        preferences.interests.includes(interest)
                          ? 'bg-[#FF385C] text-white'
                          : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher'].map((diet) => (
                    <button
                      key={diet}
                      onClick={() => toggleDietary(diet)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        preferences.dietary_restrictions.includes(diet)
                          ? 'bg-[#FF385C] text-white'
                          : isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobility */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Accessibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.mobility_needs.wheelchair}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        mobility_needs: { ...preferences.mobility_needs, wheelchair: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-[#FF385C] focus:ring-[#FF385C]"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Wheelchair accessible
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.mobility_needs.child_friendly}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        mobility_needs: { ...preferences.mobility_needs, child_friendly: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-[#FF385C] focus:ring-[#FF385C]"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Child-friendly activities
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF385C] hover:bg-[#E31C5F] text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating your plan...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Travel Plan
              </>
            )}
          </button>
          </>
          )}
          {/* End of form inputs - only shown with booking */}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {plan && (
            <div className="space-y-6 mt-8">
              {/* Destination Header */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' : 'bg-gradient-to-r from-pink-50 to-purple-50'}`}>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {plan.destination}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {new Date(plan.dates.check_in).toLocaleDateString()} - {new Date(plan.dates.check_out).toLocaleDateString()}
                </p>
              </div>

              {/* Weather Summary */}
              {plan.weather_summary && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <div className="flex items-start gap-2">
                    <Sun className="text-blue-500 mt-1" size={20} />
                    <div>
                      <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Weather</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{plan.weather_summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Itinerary */}
              <div>
                <h4 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Daily Itinerary
                </h4>
                <div className="space-y-3">
                  {plan.itinerary.map((day) => (
                    <div
                      key={day.day_number}
                      className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                    >
                      <button
                        onClick={() => setExpandedDay(expandedDay === day.day_number ? null : day.day_number)}
                        className="w-full p-4 flex items-center justify-between"
                      >
                        <div className="text-left">
                          <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Day {day.day_number}
                          </h5>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        {expandedDay === day.day_number ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      
                      {expandedDay === day.day_number && (
                        <div className={`px-4 pb-4 space-y-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          {day.morning && (
                            <div className="pt-3">
                              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.morning.time} - Morning
                              </p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.morning.activity}</p>
                              {day.morning.description && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.morning.description}</p>
                              )}
                            </div>
                          )}
                          {day.afternoon && (
                            <div>
                              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.afternoon.time} - Afternoon
                              </p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.afternoon.activity}</p>
                              {day.afternoon.description && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.afternoon.description}</p>
                              )}
                            </div>
                          )}
                          {day.evening && (
                            <div>
                              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.evening.time} - Evening
                              </p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.evening.activity}</p>
                              {day.evening.description && (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.evening.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Restaurants */}
              {plan.restaurants && plan.restaurants.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowRestaurants(!showRestaurants)}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Utensils size={20} className="inline mr-2" />
                      Restaurants ({plan.restaurants.length})
                    </h4>
                    {showRestaurants ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {showRestaurants && (
                    <div className="space-y-3">
                      {plan.restaurants.map((restaurant, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {restaurant.name}
                            </h5>
                            {restaurant.price_tier && (
                              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                {restaurant.price_tier}
                              </span>
                            )}
                          </div>
                          {restaurant.cuisine && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {restaurant.cuisine}
                            </p>
                          )}
                          {restaurant.description && (
                            <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {restaurant.description}
                            </p>
                          )}
                          {restaurant.dietary_tags && restaurant.dietary_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {restaurant.dietary_tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Packing List */}
              {plan.packing_list && plan.packing_list.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPacking(!showPacking)}
                    className="w-full flex items-center justify-between mb-3"
                  >
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Packing List
                    </h4>
                    {showPacking ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {showPacking && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <ul className="space-y-2">
                        {plan.packing_list.map((item, idx) => (
                          <li key={idx} className={`text-sm flex items-start gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="text-[#FF385C]">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Local Tips */}
              {plan.local_tips && plan.local_tips.length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Local Tips
                  </h4>
                  <ul className="space-y-1">
                    {plan.local_tips.map((tip, idx) => (
                      <li key={idx} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        💡 {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

