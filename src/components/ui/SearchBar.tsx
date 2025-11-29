import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Ask Pier anything...',
  onSend,
  disabled = false,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSend) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <Send className={`h-5 w-5 ${input.trim() ? 'text-blue-600' : 'text-gray-400'}`} />
        </button>
      </div>
    </form>
  );
};

