import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ClipboardList } from 'lucide-react';

const TravelChecklist = ({ category }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let list = [];
    const cat = category?.toLowerCase() || '';

    if (cat.includes('beach') || cat.includes('island')) {
      list = [
        { id: 1, text: 'Swimwear & Beach clothing', checked: false },
        { id: 2, text: 'Broad-spectrum Sunscreen (SPF 50+)', checked: false },
        { id: 3, text: 'Polarized Sunglasses', checked: false },
        { id: 4, text: 'Beach towel & Tote bag', checked: false },
        { id: 5, text: 'Waterproof phone pouch', checked: false },
      ];
    } else if (cat.includes('cabin') || cat.includes('country') || cat.includes('lake')) {
      list = [
        { id: 1, text: 'Warm layering jacket', checked: false },
        { id: 2, text: 'Sturdy Hiking boots / sneakers', checked: false },
        { id: 3, text: 'Eco-friendly Insect repellent', checked: false },
        { id: 4, text: 'Portable Flashlight / Headlamp', checked: false },
        { id: 5, text: 'Waterproof windbreaker', checked: false },
      ];
    } else if (cat.includes('castle') || cat.includes('design') || cat.includes('modern')) {
      list = [
        { id: 1, text: 'Smart-casual / Elegant evening wear', checked: false },
        { id: 2, text: 'Universal travel adapter plug', checked: false },
        { id: 3, text: 'High-quality Camera / smartphone charger', checked: false },
        { id: 4, text: 'Comfortable city walking shoes', checked: false },
        { id: 5, text: 'Lightweight umbrella', checked: false },
      ];
    } else {
      list = [
        { id: 1, text: 'Comfortable casual clothes', checked: false },
        { id: 2, text: 'Travel size toiletries kit', checked: false },
        { id: 3, text: 'First-aid basics & personal meds', checked: false },
        { id: 4, text: 'Cash & Cards holder', checked: false },
        { id: 5, text: 'Phone chargers & Power bank', checked: false },
      ];
    }
    setItems(list);
  }, [category]);

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const progress = Math.round((items.filter(i => i.checked).length / items.length) * 100) || 0;

  return (
    <div className="rounded-3xl p-6 ios-glass shadow-lg">
      <div className="flex items-center gap-2 border-b pb-3 dark:border-neutral-800">
        <ClipboardList className="h-5 w-5 text-brand" />
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">Smart Packing Assistant</h3>
          <p className="text-[10px] text-neutral-500 font-medium">Custom checklists for {category} stays</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex w-full items-center gap-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition hover:opacity-80"
          >
            {item.checked ? (
              <CheckSquare className="h-4.5 w-4.5 text-brand fill-brand/10 shrink-0" />
            ) : (
              <Square className="h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            )}
            <span className={item.checked ? 'line-through text-neutral-450 dark:text-neutral-550' : ''}>
              {item.text}
            </span>
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5">
          <span>PACKING COMPLETED</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-neutral-100 rounded-full dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TravelChecklist;
