import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface TagSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select options',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  const availableOptions = options.filter(opt => !selected.includes(opt));

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
      </label>

      <div className="space-y-3">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {selected.map((item) => (
                <motion.span
                  key={item}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-full text-sm font-medium group hover:bg-neutral-700 transition-colors"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(item)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${item}`}
                  >
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}

        {availableOptions.length > 0 && (
          <div className="space-y-2">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <Plus size={16} />
                <span>
                  {selected.length === 0
                    ? placeholder
                    : `Add more (${availableOptions.length} available)`}
                </span>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700">
                    Select from available options
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        toggleOption(option);
                        if (availableOptions.length === 1) {
                          setIsExpanded(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full text-sm text-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-200"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {selected.length === 0 && availableOptions.length === 0 && (
          <p className="text-sm text-neutral-500 italic">No options available</p>
        )}
      </div>
    </div>
  );
};
