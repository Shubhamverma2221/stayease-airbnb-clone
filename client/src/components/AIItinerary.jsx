import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Compass, Sparkles, RefreshCw, Printer } from 'lucide-react';
import axios from 'axios';

const AIItinerary = ({ propertyId }) => {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [stage, setStage] = useState('');

  const generate = async () => {
    setLoading(true);
    setItinerary(null);

    // Dynamic high-fidelity loading stages to wow the user
    const stages = [
      'Scanning local environment...',
      'Mapping tourist attraction points...',
      'Parsing current weather outlook...',
      'Optimizing trip pacing index...',
      'Compiling 3-Day StayEase Itinerary...'
    ];

    let currentStage = 0;
    setStage(stages[0]);
    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setStage(stages[currentStage]);
      }
    }, 450);

    try {
      const res = await axios.post('/api/ai/itinerary', { propertyId });
      clearInterval(interval);
      // Extra delay for fluid transition
      setTimeout(() => {
        setItinerary(res.data.itinerary);
        setLoading(false);
      }, 350);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      alert('Could not compile itinerary. Please try again.');
    }
  };

  return (
    <div className="rounded-3xl p-6 ios-glass shadow-lg relative overflow-hidden">
      {/* Background soft pulse */}
      {loading && (
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 flex flex-col items-center justify-center p-6 backdrop-blur-md z-10 animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-brand border-t-transparent animate-spin" />
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">StayEase AI Engine</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold animate-pulse">{stage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-brand" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Smart AI Itinerary</h3>
            <p className="text-[10px] text-neutral-500 font-medium">Automated 3-day local travel guide</p>
          </div>
        </div>
        {itinerary && (
          <button
            onClick={generate}
            className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 transition"
            title="Regenerate Itinerary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!itinerary ? (
        /* Empty State */
        <div className="mt-6 text-center space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
            Let our local AI travel assistant scan the destination, coordinates, weather, and nearby attractions to create a customized 3-day activities schedule.
          </p>
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Itinerary</span>
          </button>
        </div>
      ) : (
        /* Active Itinerary */
        <div className="mt-5 space-y-4">
          {/* Day selection tabs */}
          <div className="flex gap-1.5 border-b dark:border-neutral-800 pb-2">
            {[1, 2, 3].map(d => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
                  activeDay === d
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                    : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                Day {d}
              </button>
            ))}
          </div>

          {/* Timeline cards */}
          <div className="space-y-4">
            {itinerary
              .find(item => item.day === activeDay)
              ?.schedule.map((slot, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-brand/20 dark:border-brand/10 last:border-0 pb-1">
                  {/* Timeline dot */}
                  <span className="absolute -left-[6px] top-1 h-2.5 w-2.5 rounded-full bg-brand shadow-sm" />
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {slot.time}
                    </span>
                    <h4 className="text-xs font-black text-neutral-900 dark:text-white">
                      {slot.event}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold leading-relaxed">
                      {slot.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIItinerary;
