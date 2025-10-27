import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check } from 'lucide-react';
import useTravelStore, { type ChipData } from '../../stores/travelStore';

interface SmartChipProps {
  chip: ChipData;
  onUpdate: (chipId: string, value: any) => void;
}

const SmartChip: React.FC<SmartChipProps> = ({ chip, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(chip.value);

  const handleSave = () => {
    onUpdate(chip.id, localValue);
    setIsEditing(false);
  };

  const handleSelectOption = (option: string) => {
    onUpdate(chip.id, option);
    setIsEditing(false);
  };

  const chipColors = {
    flight: 'bg-blue-100 text-blue-700 border-blue-200',
    hotel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    addon: 'bg-amber-100 text-amber-700 border-amber-200',
    general: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={() => chip.editable && setIsEditing(!isEditing)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          border transition-all
          ${chipColors[chip.type]}
          ${chip.editable ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}
        `}
      >
        <span className="text-xs font-semibold opacity-70">{chip.label}:</span>
        <span>{chip.value}</span>
        {chip.editable && (
          <ChevronDown
            size={14}
            className={`transition-transform ${isEditing ? 'rotate-180' : ''}`}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isEditing && chip.editable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-3 min-w-[200px] z-50"
          >
            {chip.options ? (
              <div className="space-y-1">
                {chip.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors flex items-center justify-between"
                  >
                    <span>{option}</span>
                    {chip.value === option && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSave();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setLocalValue(chip.value);
                      setIsEditing(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SmartChipsBar: React.FC = () => {
  const { chips, updateChip } = useTravelStore();

  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 py-3"
    >
      {chips.map((chip) => (
        <SmartChip key={chip.id} chip={chip} onUpdate={updateChip} />
      ))}
    </motion.div>
  );
};