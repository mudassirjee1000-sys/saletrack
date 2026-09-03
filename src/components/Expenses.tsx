import React, { useState } from "react";
import { Expense, ShopSettings } from "../types";
import {
  Plus,
  Receipt,
  Search,
  Trash2,
  Edit2,
  X,
  DollarSign,
  Calendar,
  Tag,
  Filter,
} from "lucide-react";

interface ExpensesProps {
  expenses: Expense[];
  settings: ShopSettings;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

const DEFAULT_CATEGORIES = [
  "Electricity",
  "Transport",
  "Rent",
  "Packaging",
  "Supplies",
  "Maintenance",
  "Other",
];

export const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  settings,
  onSaveExpense,
  onDeleteExpense,
  isAddModalOpen: externalIsAddModalOpen,
  setIsAddModalOpen: externalSetIsAddModalOpen,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen =
    externalIsAddModalOpen !== undefined ? externalIsAddModalOpen : internalModalOpen;
  const setIsModalOpen = externalSetIsAddModalOpen || setInternalModalOpen;

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Electricity");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setEditingExpense(null);
    setName("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("Electricity");
    setNote("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setName(exp.name);
    setAmount(exp.amount.toString());
    setDate(exp.date);
    setCategory(exp.category);
    setNote(exp.note || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Expense description is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : "exp-" + Date.now(),
      name: trimmedName,
      category,
      amount: parsedAmount,
      date,
      note: note.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    setIsModalOpen(false);
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header & Record Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-800">Shop Operating Expenses</h2>
          <p className="text-xs text-slate-400">
            Total recorded expenses: {settings.currency}
            {totalExpensesAmount.toFixed(2)} ({expenses.length} records)
          </p>
        </div>

        <button
          id="add-expense-main-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expense description or note..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Expense Categories</option>
          {DEFAULT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">No expense records found.</p>
          <p className="mt-1">Click "Record Expense" to add store utility, transport, or rent costs.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{exp.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Date: {exp.date}</span>
                  {exp.note && <span>• Note: {exp.note}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-bold text-red-600 text-sm block">
                    -{settings.currency}
                    {exp.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(exp)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    title="Edit Expense"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setExpenseToDelete(exp)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingExpense ? "Edit Expense" : "Record Store Expense"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Expense Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electricity Bill, Transport to market"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({settings.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Note / Receipt Reference
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Paid in cash to delivery driver"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition"
                >
                  {editingExpense ? "Save Changes" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-800">Delete Expense Record?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{expenseToDelete.name}</strong> (
                {settings.currency}
                {expenseToDelete.amount.toFixed(2)})?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
