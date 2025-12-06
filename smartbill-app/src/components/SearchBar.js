// SearchBar.js
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="flex-1 relative flex items-center bg-white border border-gray-200 rounded-lg pl-4 pr-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
    <Search size={20} className="text-gray-400 mr-3" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent py-3 text-gray-900 placeholder-gray-400 outline-none"
    />
  </div>
);

export default SearchBar;