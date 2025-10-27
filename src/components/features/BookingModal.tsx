import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, CreditCard } from 'lucide-react';
import { useState } from 'react';
import useTravelStore, { type TravelOffer } from '../../stores/travelStore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOffer: TravelOffer | null;
  onConfirm: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedOffer,
  onConfirm,
}) => {
  const { activeTravelRequest } = useTravelStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !selectedOffer) return null;

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsSuccess(true);

    setTimeout(() => {
      onConfirm();
      setIsSuccess(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {isSuccess ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check size={40} className="text-emerald-600" />
              </motion.div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-slate-600">
                Your travel request has been submitted successfully. You'll receive confirmation shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900">Confirm Booking</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Booking Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service:</span>
                      <span className="font-medium text-slate-900">{selectedOffer.summary}</span>
                    </div>
                    {selectedOffer.terms.dates && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Dates:</span>
                        <span className="font-medium text-slate-900">{selectedOffer.terms.dates}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-slate-600">Total Price:</span>
                      <span className="font-semibold text-slate-900 text-lg">
                        {formatPrice(selectedOffer.price_cents, selectedOffer.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {activeTravelRequest?.entities && (
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Trip Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {activeTravelRequest.entities.flight && (
                        <>
                          {activeTravelRequest.entities.flight.from && (
                            <div className="text-sm">
                              <div className="text-slate-500">From</div>
                              <div className="font-medium text-slate-900">
                                {activeTravelRequest.entities.flight.from}
                              </div>
                            </div>
                          )}
                          {activeTravelRequest.entities.flight.to && (
                            <div className="text-sm">
                              <div className="text-slate-500">To</div>
                              <div className="font-medium text-slate-900">
                                {activeTravelRequest.entities.flight.to}
                              </div>
                            </div>
                          )}
                          {activeTravelRequest.entities.flight.cabin && (
                            <div className="text-sm">
                              <div className="text-slate-500">Cabin Class</div>
                              <div className="font-medium text-slate-900">
                                {activeTravelRequest.entities.flight.cabin}
                              </div>
                            </div>
                          )}
                          {activeTravelRequest.entities.flight.passengers && (
                            <div className="text-sm">
                              <div className="text-slate-500">Passengers</div>
                              <div className="font-medium text-slate-900">
                                {activeTravelRequest.entities.flight.passengers}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {activeTravelRequest.entities.hotel && (
                        <>
                          {activeTravelRequest.entities.hotel.city && (
                            <div className="text-sm col-span-2">
                              <div className="text-slate-500">City</div>
                              <div className="font-medium text-slate-900">
                                {activeTravelRequest.entities.hotel.city}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Travel Protection</div>
                    <div className="text-blue-700">
                      This booking is covered by Pier's traveler protection policy. Cancel or modify up to 24 hours before departure.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg">
                  <CreditCard size={20} className="text-slate-500" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">Payment Method</div>
                    <div className="text-slate-600">Card ending in 4242</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-200">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};