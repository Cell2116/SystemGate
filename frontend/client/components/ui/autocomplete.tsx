import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';

interface AutocompleteProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  required?: boolean;
  maxSuggestions?: number;
  autoShowOnValueChange?: boolean;
}

export function Autocomplete({
  id,
  label,
  placeholder = "Type to search...",
  value,
  onChange,
  suggestions,
  className = "",
  required = false,
  maxSuggestions = 10,
  autoShowOnValueChange = true
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [userTyping, setUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.length > 0 && userTyping && autoShowOnValueChange) {
      const filtered = suggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, maxSuggestions);
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [value, suggestions, maxSuggestions, userTyping, autoShowOnValueChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTyping(true);
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserTyping(false);
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          setUserTyping(false);
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        setUserTyping(false);
        break;
    }
  };

  const handleInputFocus = () => {
    setUserTyping(true);
    if (value.length > 0 && filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setUserTyping(false);
    }, 150);
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={`${className} ${isOpen ? 'rounded-b-none border-b-0' : ''}`}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          <ul ref={listRef} className="py-1">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  index === highlightedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && filteredSuggestions.length === 0 && value.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No suggestions found
          </div>
        </div>
      )}
    </div>
  );
}
