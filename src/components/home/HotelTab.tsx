import { useIntercom } from '../../hooks/useIntercom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function HotelTab() {
  const { trackEvent } = useIntercom();
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);

  const handleSearch = async () => {
    // Track event
    trackEvent('hotel_search_started', {
      destination,
      checkin,
      checkout,
      has_preferences: preferences.length > 0,
    });
    
    // Navigate to hotel recommendations
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkin) params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
    
    navigate(`/hotels/recommendations?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl mb-3">Find Your Perfect Hotel</h2>
        <p className="text-lg text-[#a0a0a0]">
          Search for hotels that match your preferences
        </p>
      </div>

      <div className="p-6 bg-[#141414] border border-[#2a2a2a] rounded-xl space-y-4">
        <div>
          <label className="block text-sm mb-2 text-[#e8e8e8]">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or hotel name"
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#e8e8e8] focus:outline-none focus:border-[#c9b896]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-[#e8e8e8]">Check-in</label>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#e8e8e8] focus:outline-none focus:border-[#c9b896]"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#e8e8e8]">Check-out</label>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#e8e8e8] focus:outline-none focus:border-[#c9b896]"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="w-full px-6 py-3 bg-[#c9b896] text-[#0a0a0a] rounded-full hover:bg-[#d4c5a8] transition-colors font-medium"
        >
          Search Hotels
        </button>
      </div>
    </div>
  );
}

