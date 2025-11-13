// components/AIAgentSidebar.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, MapPin, Calendar, User, Bot, Sun, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { useDarkMode } from '../App';
import { useAuth } from '../context/AuthContext';
import agentService from '../services/agentService';

interface AIAgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: number;
  bookingDetails?: {
    property_name: string;
    city: string;
    state: string;
    check_in: string;
    check_out: string;
    number_of_guests: number;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any; // For structured data like booking lists or plans
}

export default function AIAgentSidebar({ isOpen, onClose, bookingId }: AIAgentSidebarProps) {
  const { isDark } = useDarkMode();
  const { user } = useAuth();
  
  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for expandable itinerary sections
  const [expandedDays, setExpandedDays] = useState<{[key: string]: number | null}>({});
  const [showRestaurants, setShowRestaurants] = useState<{[key: string]: boolean}>({});
  const [showPacking, setShowPacking] = useState<{[key: string]: boolean}>({});
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hi ${user?.name || 'there'}! 👋 I'm your AI travel assistant. I can help you with:\n\n• View your bookings\n• Plan trips for your bookings\n• Get travel recommendations\n• Answer questions about your travels\n\nTry asking me "Show me my bookings" or "Tell me about my upcoming trips!"`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, user]);

  const handleSendMessage = async () => {
    if (!query.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    
    try {
      console.log('💬 Sending chat message:', userMessage.content);
      
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = [...messages, userMessage]
        .slice(-10) // Keep last 10 messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Call conversational API with history
      const response = await agentService.chat({
        message: userMessage.content,
        booking_id: bookingId,
        conversation_history: conversationHistory
      });
      
      console.log('✅ Chat response:', response);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        data: response.data // Could contain bookings, plans, etc.
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Initialize expandable sections for new messages with plans
      if (response.data?.plan) {
        setShowRestaurants({...showRestaurants, [assistantMessage.id]: true});
        setShowPacking({...showPacking, [assistantMessage.id]: true});
      }
      
    } catch (err: any) {
      console.error('❌ Chat error:', err);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to AI service. Please ensure the agent service is running.';
      } else if (err.response?.status === 503) {
        errorMessage = '🤖 AI service is not available. Please start the agent service.';
      } else if (err.response?.status === 504) {
        errorMessage = '⏱️ Request timed out. Please try again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
        } shadow-2xl z-[9999] flex flex-col transition-transform`}
      >
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#FF385C]" size={24} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Travel Assistant
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

        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-pink-900' : 'bg-pink-100'} flex items-center justify-center`}>
                  <Bot size={18} className="text-[#FF385C]" />
          </div>
        )}

              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? isDark
                        ? 'bg-pink-900 text-white'
                        : 'bg-[#FF385C] text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-100'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

                {/* Show structured data if present (e.g., bookings list) */}
                {message.data && message.data.bookings && (
                  <div className="mt-2 space-y-2">
                    {message.data.bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className={`p-3 rounded-lg border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {booking.property_name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <MapPin size={12} className="inline mr-1" />
                          {booking.city}, {booking.state}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
            </div>
          )}

                {/* Show travel plan/itinerary if present */}
                {message.data && message.data.plan && (
                  <div className="mt-3 space-y-3">
              {/* Weather Summary */}
                    {message.data.plan.weather_summary && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <div className="flex items-start gap-2">
                          <Sun className="text-blue-500 mt-1" size={16} />
                    <div>
                            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Weather</p>
                            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{message.data.plan.weather_summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Itinerary */}
                    {message.data.plan.itinerary && message.data.plan.itinerary.length > 0 && (
              <div>
                        <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Daily Itinerary
                        </p>
                        <div className="space-y-2">
                          {message.data.plan.itinerary.map((day: any) => (
                    <div
                      key={day.day_number}
                      className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                    >
                      <button
                                onClick={() => setExpandedDays({...expandedDays, [message.id]: expandedDays[message.id] === day.day_number ? null : day.day_number})}
                                className="w-full p-3 flex items-center justify-between text-left"
                      >
                                <div>
                                  <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Day {day.day_number}
                                  </p>
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                                {expandedDays[message.id] === day.day_number ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                              {expandedDays[message.id] === day.day_number && (
                                <div className={`px-3 pb-3 space-y-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          {day.morning && (
                                    <div className="pt-2">
                                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.morning.time} - Morning
                              </p>
                                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.morning.activity}</p>
                              {day.morning.description && (
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.morning.description}</p>
                              )}
                            </div>
                          )}
                          {day.afternoon && (
                            <div>
                                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.afternoon.time} - Afternoon
                              </p>
                                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.afternoon.activity}</p>
                              {day.afternoon.description && (
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.afternoon.description}</p>
                              )}
                            </div>
                          )}
                          {day.evening && (
                            <div>
                                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {day.evening.time} - Evening
                              </p>
                                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.evening.activity}</p>
                              {day.evening.description && (
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{day.evening.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
                    )}

              {/* Restaurants */}
                    {message.data.plan.restaurants && message.data.plan.restaurants.length > 0 && (
                <div>
                  <button
                          onClick={() => setShowRestaurants({...showRestaurants, [message.id]: !showRestaurants[message.id]})}
                          className="w-full flex items-center justify-between mb-2"
                        >
                          <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Utensils size={14} className="inline mr-1" />
                            Restaurants ({message.data.plan.restaurants.length})
                          </p>
                          {showRestaurants[message.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                        {showRestaurants[message.id] && (
                          <div className="space-y-2">
                            {message.data.plan.restaurants.map((restaurant: any, idx: number) => (
                        <div
                          key={idx}
                                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                        >
                                <div className="flex items-start justify-between mb-1">
                                  <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {restaurant.name}
                                  </p>
                            {restaurant.price_tier && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                {restaurant.price_tier}
                              </span>
                            )}
                          </div>
                          {restaurant.cuisine && (
                                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {restaurant.cuisine}
                            </p>
                          )}
                          {restaurant.description && (
                                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {restaurant.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Packing List */}
                    {message.data.plan.packing_list && message.data.plan.packing_list.length > 0 && (
                <div>
                  <button
                          onClick={() => setShowPacking({...showPacking, [message.id]: !showPacking[message.id]})}
                          className="w-full flex items-center justify-between mb-2"
                  >
                          <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Packing List
                          </p>
                          {showPacking[message.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                        {showPacking[message.id] && (
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <ul className="space-y-1">
                              {message.data.plan.packing_list.map((item: string, idx: number) => (
                                <li key={idx} className={`text-xs flex items-start gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                    {message.data.plan.local_tips && message.data.plan.local_tips.length > 0 && (
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Local Tips
                        </p>
                  <ul className="space-y-1">
                          {message.data.plan.local_tips.map((tip: string, idx: number) => (
                            <li key={idx} className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        💡 {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
                
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  {user?.profile_picture ? (
                    <img 
                      src={`http://localhost:5001${user.profile_picture}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center text-white font-semibold text-sm">${user?.name.charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F] flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isDark ? 'bg-pink-900' : 'bg-pink-100'} flex items-center justify-center`}>
                <Bot size={18} className="text-[#FF385C]" />
              </div>
              <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Loader2 className="animate-spin text-[#FF385C]" size={20} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-4`}>
          <div className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your bookings, trips, or travel plans..."
              rows={1}
              className={`flex-1 px-4 py-3 rounded-lg border resize-none ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-[#FF385C] focus:border-transparent`}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !query.trim()}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                loading || !query.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#FF385C] hover:bg-[#E31C5F] text-white'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

