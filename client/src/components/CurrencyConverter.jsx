import React, { useState, useEffect } from 'react';
import { Landmark, RefreshCw } from 'lucide-react';
import axios from 'axios';

const CurrencyConverter = ({ priceInINR }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [nights, setNights] = useState(1);
  const [rates, setRates] = useState({
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AUD: 0.018,
    JPY: 1.91
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const res = await axios.get('https://open.er-api.com/v6/latest/INR');
        if (res.data && res.data.rates) {
          const apiRates = res.data.rates;
          setRates({
            USD: apiRates.USD || 0.012,
            EUR: apiRates.EUR || 0.011,
            GBP: apiRates.GBP || 0.0094,
            AUD: apiRates.AUD || 0.018,
            JPY: apiRates.JPY || 1.91
          });
        }
      } catch (err) {
        console.error('Failed to load real exchange rates:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    JPY: '¥'
  };

  const convertedNightPrice = (priceInINR * (rates[selectedCurrency] || 0.012)).toFixed(2);
  const totalConverted = (priceInINR * nights * (rates[selectedCurrency] || 0.012)).toFixed(2);

  return (
    <div className="rounded-3xl p-6 ios-glass shadow-lg">
      <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Currency Estimator</h3>
            <p className="text-[10px] text-neutral-500 font-medium">Live exchange rate estimator</p>
          </div>
        </div>
        {loading && (
          <RefreshCw className="h-3.5 w-3.5 text-brand animate-spin" />
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* Currencies grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {Object.keys(rates).map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`rounded-xl py-2 text-center text-xs font-bold transition-all duration-200 ${
                selectedCurrency === cur
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-neutral-550/5 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-350 dark:hover:bg-neutral-700'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>

        {/* Calculation Details */}
        <div className="rounded-2xl bg-neutral-50/50 p-3.5 dark:bg-neutral-850/50 space-y-2 border border-neutral-100/50 dark:border-neutral-800/30">
          <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <span>Rate per Night:</span>
            <span className="font-extrabold text-neutral-900 dark:text-white">
              {symbols[selectedCurrency]} {Number(convertedNightPrice).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 pt-1.5 border-t border-dashed dark:border-neutral-850">
            <span className="flex items-center gap-1.5">
              <span>Nights duration:</span>
              <input
                type="number"
                min="1"
                max="90"
                value={nights}
                onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
                className="w-12 rounded bg-white px-1.5 py-0.5 text-center text-[11px] font-bold border outline-none dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
              />
            </span>
            <span className="font-black text-brand text-sm">
              {symbols[selectedCurrency]} {Number(totalConverted).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
