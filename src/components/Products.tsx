import React, { useState } from "react";
import { Product, ShopSettings, StockMovement } from "../types";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { StockMovementsModal } from "./StockMovementsModal";
import {
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  ArrowUpDown,
  Filter,
  Sliders,
  History,
  Barcode,
  Boxes,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface ProductsProps {
  products: Product[];
  settings: ShopSettings;
  stockMovements?: StockMovement[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, delta: number) => void;
  onAdjustStock?: (
    productId: string,
    newStock: number,
    movement: StockMovement
  ) => void;
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const Products: React.FC<ProductsProps> = ({
  products,
  settings,
  stockMovements = [],
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
  onAdjustStock,
  isAddModalOpen: externalIsAddModalOpen,
  setIsAddModalOpen: externalSetIsAddModalOpen,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = externalIsAddModalOpen !== undefined ? externalIsAddModalOpen : internalModalOpen;
  const setIsModalOpen = externalSetIsAddModalOpen || setInternalModalOpen;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Stock Modals State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetProductId, setAdjustTargetProductId] = useState<string>("");
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [maxStock, setMaxStock] = useState("");
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState("");

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    const nextNum = products.length + 1;
    setSku(`PRD-${nextNum.toString().padStart(3, "0")}`);
    setBarcode("");
    setUnit("pcs");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("10");
    setMinStock("5");
    setMaxStock("");
    setCategory("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setBarcode(product.barcode || "");
    setUnit(product.unit || "pcs");
    setPurchasePrice(product.purchasePrice.toString());
    setSellingPrice(product.sellingPrice.toString());
    setStock(product.stock.toString());
    setMinStock(product.minStock.toString());
    setMaxStock(product.maxStock ? product.maxStock.toString() : "");
    setCategory(product.category || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Product name is required.");
      return;
    }

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);
    const currentStock = parseInt(stock, 10);
    const minLevel = parseInt(minStock, 10);
    const maxLevel = maxStock.trim() ? parseInt(maxStock, 10) : undefined;

    if (isNaN(pPrice) || pPrice < 0) {
      setFormError("Purchase cost price must be 0 or higher.");
      return;
    }

    if (isNaN(sPrice) || sPrice < 0) {
      setFormError("Selling price must be 0 or higher.");
      return;
    }

    if (isNaN(currentStock) || currentStock < 0) {
      setFormError("Current stock must be a non-negative number.");
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : "prod-" + Date.now(),
      name: trimmedName,
      sku: sku.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim() || undefined,
      unit: unit.trim() || "pcs",
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      stock: currentStock,
      minStock: isNaN(minLevel) ? 5 : minLevel,
      maxStock: maxLevel,
      category: category.trim() || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(newProduct);
    setIsModalOpen(false);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      (product.barcode && product.barcode.toLowerCase().includes(q)) ||
      (product.category && product.category.toLowerCase().includes(q));

    const matchesLowStock = !filterLowStockOnly || product.stock <= product.minStock;
    const matchesCat = selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesLowStock && matchesCat;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Inventory Valuation Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Total Units In Stock
            </span>
            <span className="text-xl font-extrabold text-slate-800">
              {totalStockCount} units
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Valuation (At Cost)
            </span>
            <span className="text-xl font-extrabold text-slate-800">
              {settings.currency}
              {totalCostValuation.toFixed(2)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Retail Value (At Selling Price)
            </span>
            <span className="text-xl font-extrabold text-emerald-600">
              {settings.currency}
              {totalRetailValuation.toFixed(2)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Products & Inventory</h2>
          <p className="text-xs text-slate-400">
            {products.length} products total • {lowStockCount} low stock alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMovementsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Stock History</span>
          </button>

          {onAdjustStock && products.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAdjustTargetProductId(products[0].id);
                setIsAdjustModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Adjust Stock</span>
            </button>
          )}

          <button
            id="add-product-main-btn"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Low Stock Filter Button */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              filterLowStockOnly
                ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Low Stock ({lowStockCount})</span>
          </button>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Product List / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700">No matching products found.</p>
          <p className="mt-1">Try clearing filters or click "Add New Product" above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock <= product.minStock;
            const isOutOfStock = product.stock <= 0;
            const unitProfit = product.sellingPrice - product.purchasePrice;
            const margin = product.sellingPrice > 0 ? Math.round((unitProfit / product.sellingPrice) * 100) : 0;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition hover:border-slate-300 ${
                  isOutOfStock
                    ? "border-rose-200 bg-rose-50/20"
                    : isLowStock
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                {/* Card Top: Name, SKU, Barcode */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product.sku}
                      </span>
                      {product.barcode && (
                        <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Barcode className="w-2.5 h-2.5" />
                          <span>{product.barcode}</span>
                        </span>
                      )}
                      {product.category && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div>
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        Low ({product.stock} {product.unit || "pcs"})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {product.stock} {product.unit || "pcs"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Margin Breakdown */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cost</span>
                    <span className="font-semibold text-slate-700">
                      {settings.currency}
                      {product.purchasePrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Selling</span>
                    <span className="font-bold text-slate-800">
                      {settings.currency}
                      {product.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Profit</span>
                    <span
                      className={`font-semibold ${
                        unitProfit >= 0 ? "text-blue-600" : "text-rose-600"
                      }`}
                    >
                      {settings.currency}
                      {unitProfit.toFixed(2)} ({margin}%)
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Quick Stock & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {/* Stock counter */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateStock(product.id, -1)}
                      disabled={product.stock <= 0 && !settings.allowNegativeStock}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90 disabled:opacity-30"
                      title="Decrease stock by 1"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800 px-1 text-center">
                      {product.stock}
                    </span>
                    <button
                      onClick={() => onUpdateStock(product.id, 1)}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90"
                      title="Increase stock by 1"
                    >
                      +
                    </button>

                    {/* Dedicated Adjust stock modal trigger */}
                    {onAdjustStock && (
                      <button
                        onClick={() => {
                          setAdjustTargetProductId(product.id);
                          setIsAdjustModalOpen(true);
                        }}
                        className="ml-1 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Audit / Adjust Stock"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="Edit product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(product)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-base">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fresh Milk (1L)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PRD-001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (UPC/EAN)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 890123456789"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Groceries"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box (box)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="meter">Meter (m)</option>
                    <option value="pack">Pack (pk)</option>
                    <option value="dozen">Dozen (dz)</option>
                  </select>
                </div>
              </div>

              {/* Purchase Price & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ({settings.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({settings.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Current Stock & Min Stock Alert Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Stock Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition"
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Delete Product?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <strong>{productToDelete.name}</strong> from your
              inventory? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && onAdjustStock && (
        <StockAdjustmentModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          products={products}
          initialProductId={adjustTargetProductId}
          settings={settings}
          onAdjustStock={(productId, newStock, movement) => {
            onAdjustStock(productId, newStock, movement);
          }}
        />
      )}

      {/* Stock Movements Audit Modal */}
      {isMovementsModalOpen && (
        <StockMovementsModal
          isOpen={isMovementsModalOpen}
          onClose={() => setIsMovementsModalOpen(false)}
          movements={stockMovements}
          products={products}
          settings={settings}
        />
      )}
    </div>
  );
};
