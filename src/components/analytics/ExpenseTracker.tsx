import React, { useState, useEffect } from 'react';

interface Expenses {
  booth_cost: number;
  fuel_cost: number;
  food_cost: number;
  staff_cost: number;
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expenses>({
    booth_cost: 0,
    fuel_cost: 0,
    food_cost: 0,
    staff_cost: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempExpenses, setTempExpenses] = useState<Expenses>(expenses);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      setExpenses(parsed);
      setTempExpenses(parsed);
    }
  }, []);

  const handleInputChange = (key: keyof Expenses, value: number) => {
    setTempExpenses({ ...tempExpenses, [key]: value });
  };

  const saveExpenses = () => {
    setExpenses(tempExpenses);
    localStorage.setItem('expenses', JSON.stringify(tempExpenses));
    setIsEditing(false);
    alert('Expenses saved!');
  };

  const resetExpenses = () => {
    const newExpenses = {
      booth_cost: 0,
      fuel_cost: 0,
      food_cost: 0,
      staff_cost: 0,
    };
    setExpenses(newExpenses);
    setTempExpenses(newExpenses);
    localStorage.setItem('expenses', JSON.stringify(newExpenses));
    alert('Expenses reset for new event');
  };

  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Event Expenses</h1>

      {/* Display Mode */}
      {!isEditing ? (
        <div className="bg-white p-8 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <p className="text-gray-600 text-sm">Booth Cost</p>
              <p className="text-2xl font-bold text-orange-600">₹{expenses.booth_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm">Fuel Cost</p>
              <p className="text-2xl font-bold text-blue-600">₹{expenses.fuel_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm">Food Cost</p>
              <p className="text-2xl font-bold text-green-600">₹{expenses.food_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-gray-600 text-sm">Staff Cost</p>
              <p className="text-2xl font-bold text-purple-600">₹{expenses.staff_cost.toFixed(2)}</p>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-semibold">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTempExpenses(expenses);
                  setIsEditing(true);
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ✏️ Edit Expenses
              </button>
              <button
                onClick={resetExpenses}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                🔄 Reset for Next Event
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="bg-white p-8 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Booth Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.booth_cost}
              onChange={(e) => handleInputChange('booth_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="e.g., 1000"
            />
            <p className="text-sm text-gray-500 mt-1">Cost of the booth/stall rental</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Fuel Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.fuel_cost}
              onChange={(e) => handleInputChange('fuel_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="e.g., 200"
            />
            <p className="text-sm text-gray-500 mt-1">Transportation/fuel expenses</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Food Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.food_cost}
              onChange={(e) => handleInputChange('food_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="e.g., 500"
            />
            <p className="text-sm text-gray-500 mt-1">Food and drinks for the day</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Staff Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.staff_cost}
              onChange={(e) => handleInputChange('staff_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="e.g., 0"
            />
            <p className="text-sm text-gray-500 mt-1">Staff wages or assistance costs</p>
          </div>

          <div className="pt-4 border-t-2 border-gray-200">
            <p className="text-lg font-semibold mb-4">
              Total: <span className="text-red-600">₹{Object.values(tempExpenses).reduce((a, b) => a + b, 0).toFixed(2)}</span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={saveExpenses}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                ✅ Save Expenses
              </button>
              <button
                onClick={() => {
                  setTempExpenses(expenses);
                  setIsEditing(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="font-semibold text-blue-900 mb-2">💡 Pro Tip</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Track all expenses to calculate true profit</li>
          <li>• Compare event costs to see which pop-ups are most profitable</li>
          <li>• Expenses are included in your PDF report and profit calculations</li>
          <li>• Reset expenses at the start of each new event</li>
        </ul>
      </div>
    </div>
  );
}
