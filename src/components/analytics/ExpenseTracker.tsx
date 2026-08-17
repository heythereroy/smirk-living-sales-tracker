import { useState, useEffect } from 'react';

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
      <h1 className="text-2xl font-bold text-secondary">Event Expenses</h1>

      {/* Display Mode */}
      {!isEditing ? (
        <div className="bg-[#242424] border border-border p-8 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-tertiary rounded-lg border border-border">
              <p className="text-disabled text-sm">Booth Cost</p>
              <p className="text-2xl font-bold text-primary">₹{expenses.booth_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-tertiary rounded-lg border border-border">
              <p className="text-disabled text-sm">Fuel Cost</p>
              <p className="text-2xl font-bold text-secondary">₹{expenses.fuel_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-tertiary rounded-lg border border-border">
              <p className="text-disabled text-sm">Food Cost</p>
              <p className="text-2xl font-bold text-success">₹{expenses.food_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-tertiary rounded-lg border border-border">
              <p className="text-disabled text-sm">Staff Cost</p>
              <p className="text-2xl font-bold text-secondary">₹{expenses.staff_cost.toFixed(2)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-semibold text-secondary">Total Expenses</p>
              <p className="text-3xl font-bold text-danger">₹{totalExpenses.toFixed(2)}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTempExpenses(expenses);
                  setIsEditing(true);
                }}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-secondary rounded-lg transition-colors font-semibold"
              >
                ✏️ Edit Expenses
              </button>
              <button
                onClick={resetExpenses}
                className="flex-1 px-4 py-3 bg-tertiary border border-border hover:border-primary text-secondary rounded-lg transition-colors font-semibold"
              >
                🔄 Reset for Next Event
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="bg-[#242424] border border-border p-8 rounded-lg space-y-6">
          <div>
            <label className="block text-secondary font-semibold mb-2">Booth Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.booth_cost}
              onChange={(e) => handleInputChange('booth_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-tertiary border border-border rounded-lg text-secondary focus:outline-none focus:border-primary"
              placeholder="e.g., 1000"
            />
            <p className="text-sm text-disabled mt-1">Cost of the booth/stall rental</p>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-2">Fuel Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.fuel_cost}
              onChange={(e) => handleInputChange('fuel_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-tertiary border border-border rounded-lg text-secondary focus:outline-none focus:border-primary"
              placeholder="e.g., 200"
            />
            <p className="text-sm text-disabled mt-1">Transportation/fuel expenses</p>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-2">Food Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.food_cost}
              onChange={(e) => handleInputChange('food_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-tertiary border border-border rounded-lg text-secondary focus:outline-none focus:border-primary"
              placeholder="e.g., 500"
            />
            <p className="text-sm text-disabled mt-1">Food and drinks for the day</p>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-2">Staff Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tempExpenses.staff_cost}
              onChange={(e) => handleInputChange('staff_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-tertiary border border-border rounded-lg text-secondary focus:outline-none focus:border-primary"
              placeholder="e.g., 0"
            />
            <p className="text-sm text-disabled mt-1">Staff wages or assistance costs</p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-lg font-semibold mb-4 text-secondary">
              Total: <span className="text-danger">₹{Object.values(tempExpenses).reduce((a, b) => a + b, 0).toFixed(2)}</span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={saveExpenses}
                className="flex-1 px-4 py-3 bg-success hover:brightness-110 text-secondary rounded-lg transition-all font-semibold"
              >
                ✅ Save Expenses
              </button>
              <button
                onClick={() => {
                  setTempExpenses(expenses);
                  setIsEditing(false);
                }}
                className="flex-1 px-4 py-3 bg-tertiary border border-border hover:border-primary text-secondary rounded-lg transition-colors font-semibold"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#242424] border-l-4 border-primary p-4 rounded">
        <p className="font-semibold text-secondary mb-2">💡 Pro Tip</p>
        <ul className="text-sm text-disabled space-y-1">
          <li>• Track all expenses to calculate true profit</li>
          <li>• Compare event costs to see which pop-ups are most profitable</li>
          <li>• Expenses are included in your PDF report</li>
          <li>• Reset expenses at the start of each new event</li>
        </ul>
      </div>
    </div>
  );
}
