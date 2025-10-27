import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Heart, Check, Loader2 } from 'lucide-react';
import useTravelStore, { type TravelOffer } from '../../stores/travelStore';

interface ResultCardProps {
  offer: TravelOffer;
  onSelect: (offerId: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ offer, onSelect }) => {
  const icons = {
    air: Plane,
    hotel: Hotel,
    dining: Hotel,
    experience: Heart,
    car: Hotel,
  };

  const Icon = icons[offer.supplier_type] || Hotel;

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-white rounded-xl border overflow-hidden transition-all
        ${offer.selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}
      `}
    >
      {offer.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={offer.image_url}
            alt={offer.summary}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={16} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 text-sm leading-tight">
                {offer.summary}
              </h4>
              {offer.terms.description && (
                <p className="text-xs text-slate-500 mt-1">{offer.terms.description}</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-semibold text-slate-900">
              {formatPrice(offer.price_cents, offer.currency)}
            </div>
            {offer.terms.per && (
              <div className="text-xs text-slate-500">{offer.terms.per}</div>
            )}
          </div>
        </div>

        {offer.terms.highlights && offer.terms.highlights.length > 0 && (
          <div className="space-y-1 mb-3">
            {offer.terms.highlights.slice(0, 3).map((highlight: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                <Check size={12} className="text-emerald-500 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onSelect(offer.id)}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-medium transition-all
            ${
              offer.selected
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
        >
          {offer.selected ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={16} />
              Selected
            </span>
          ) : (
            'Select'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export const ResultCards: React.FC = () => {
  const { activeTravelRequest, isSearching, setResults } = useTravelStore();

  const handleSelectOffer = (offerId: string) => {
    if (!activeTravelRequest) return;

    const updatedResults = activeTravelRequest.results.map((offer) => ({
      ...offer,
      selected: offer.id === offerId,
    }));

    setResults(updatedResults);
  };

  if (!activeTravelRequest && !isSearching) return null;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {isSearching && (!activeTravelRequest || activeTravelRequest.results.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Loader2 size={24} className="text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              Searching for options
            </h3>
            <p className="text-sm text-slate-500">
              We're finding the best options for your trip...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTravelRequest && activeTravelRequest.results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">
              Available Options ({activeTravelRequest.results.length})
            </h3>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Best Match</option>
              <option>Lowest Price</option>
              <option>Highest Rated</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeTravelRequest.results
                .sort((a, b) => a.rank - b.rank)
                .map((offer) => (
                  <ResultCard key={offer.id} offer={offer} onSelect={handleSelectOffer} />
                ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};