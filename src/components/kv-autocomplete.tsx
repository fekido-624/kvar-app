'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface KVSuggestion {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  kodKV: string;
}

interface KVAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onKVSelect?: (item: KVSuggestion) => void;
  placeholder?: string;
  required?: boolean;
}

export function KVAutocomplete({
  value,
  onValueChange,
  onKVSelect,
  placeholder = 'Cari atau taip kod/nama KV',
  required = false,
}: KVAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<KVSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchKV = async () => {
      if (value.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/kv/search?q=${encodeURIComponent(value)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSuggestions(data.kvList ?? []);
        setShowSuggestions(data.kvList && data.kvList.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchKV, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const handleSelectKV = (item: KVSuggestion) => {
    onValueChange(item.kodKV);
    onKVSelect?.(item);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return text;

    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'ig');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
      if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;
      return (
        <mark key={`${part}-${index}`} className="bg-yellow-200/70 rounded px-0.5">
          {part}
        </mark>
      );
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        required={required}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((kv) => (
              <button
                key={kv.id}
                type="button"
                onClick={() => handleSelectKV(kv)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-sm">{highlightMatch(kv.kodKV, value)}</div>
                <div className="text-xs text-gray-500">{highlightMatch(kv.name, value)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && value.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md p-2 text-sm text-gray-500 z-50">
          Mencari...
        </div>
      )}
    </div>
  );
}
