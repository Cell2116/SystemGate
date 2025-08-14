import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';

interface Employee {
  name: string;
  department: string;
  licensePlate?: string;
}

interface EmployeeAutocompleteProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, employee?: Employee) => void;
  employees: Employee[];
  className?: string;
  required?: boolean;
  maxSuggestions?: number;
}

export function EmployeeAutocomplete({
  id,
  label,
  placeholder = "Type employee name...",
  value,
  onChange,
  employees,
  className = "",
  required = false,
  maxSuggestions = 10
}: EmployeeAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = employees
        .filter(employee => 
          employee.name.toLowerCase().includes(value.toLowerCase()) ||
          employee.department.toLowerCase().includes(value.toLowerCase()) ||
          (employee.licensePlate && employee.licensePlate.toLowerCase().includes(value.toLowerCase()))
        )
        .slice(0, maxSuggestions);
      setFilteredEmployees(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredEmployees([]);
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [value, employees, maxSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleEmployeeClick = (employee: Employee) => {
    onChange(employee.name, employee);
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
          prev < filteredEmployees.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredEmployees.length) {
          handleEmployeeClick(filteredEmployees[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (value.length > 0 && filteredEmployees.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
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
      
      {isOpen && filteredEmployees.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          <ul ref={listRef} className="py-1">
            {filteredEmployees.map((employee, index) => (
              <li
                key={`${employee.name}-${employee.department}`}
                onClick={() => handleEmployeeClick(employee)}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{employee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {employee.department}
                    {employee.licensePlate && ` • ${employee.licensePlate}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && filteredEmployees.length === 0 && value.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border border-t-0 rounded-b-md shadow-lg">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No employees found
          </div>
        </div>
      )}
    </div>
  );
}
