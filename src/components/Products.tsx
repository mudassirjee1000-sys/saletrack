import React, { useState } from "react";
import { Product, ShopSettings } from "../types";
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
} from "lucide-react";

interface ProductsProps {
  products: Product[];
  settings: ShopSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, delta: number) => void;
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const Products: React.FC<ProductsProps> = ({
  products,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
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

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState("");

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    // Suggest a new SKU
    const nextNum = products.length + 1;
    setSku(`PRD-${nextNum.toString().padStart(3, "0")}`);
    setPurchasePrice("");
    setSellingPrice("");
    setStock("10");
    setMinStock("5");
    setCategory("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPurchasePrice(product.purchasePrice.toString());
    setSellingPrice(product.sellingPrice.toString());
    setStock(product.stock.toString());
    setMinStock(product.minStock.toString());
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

    if (isNaN(pPrice) || pPrice < 0) {
      setFormError("Purchase price must be a valid number (0 or higher).");
      return;
    }

    if (isNaN(sPrice) || sPrice < 0) {
      setFormError("Selling price must be a valid number (0 or higher).");
      return;
    }

    // Note: Allow promotional clearance sales without blocking native dialog


    if (isNaN(currentStock) || currentStock < 0) {
      setFormError("Current stock must be a non-negative number.");
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : "prod-" + Date.now(),
      name: trimmedName,
      sku: sku.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      stock: currentStock,
      minStock: isNaN(minLevel) ? 5 : minLevel,
      category: category.trim() || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(newProduct);
    setIsModalOpen(false);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLowStock = !filterLowStockOnly || product.stock <= product.minStock;
    const matchesCat = selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesLowStock && matchesCat;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-800">Products & Inventory</h2>
          <p className="text-xs text-slate-400">
            {products.length} products total • {lowStockCount} low stock alerts
          </p>
        </div>

        <button
          id="add-product-main-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-products-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name, SKU, or category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Low Stock Toggle Button */}
          <button
            id="filter-low-stock-btn"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              filterLowStockOnly
                ? "bg-red-50 text-red-700 border-red-200 font-semibold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
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
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
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
                    ? "border-red-200 bg-red-50/20"
                    : isLowStock
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                {/* Card Top: Name & SKU */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product.sku}
                      </span>
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        Low ({product.stock})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                        {product.stock} in stock
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
                        unitProfit >= 0 ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {settings.currency}
                      {unitProfit.toFixed(2)} ({margin}%)
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Stock Controls & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {/* Quick stock adjustment buttons */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400 mr-1">Stock:</span>
                    <button
                      onClick={() => onUpdateStock(product.id, -1)}
                      disabled={product.stock <= 0}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90 disabled:opacity-30"
                      title="Decrease stock by 1"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800 w-8 text-center">
                      {product.stock}
                    </span>
                    <button
                      onClick={() => onUpdateStock(product.id, 1)}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-90"
                      title="Increase stock by 1"
                    >
                      +
                    </button>
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
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProduct ? "Edit Product Details" : "Add New Product"}
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

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
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

              {/* SKU & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU / Barcode
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
              </div>

              {/* Purchase Price & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ({settings.currency}) <span className="text-red-500">*</span>
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
                    Selling Price ({settings.currency}) <span className="text-red-500">*</span>
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
                    Current Stock Qty <span className="text-red-500">*</span>
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
                    Low Stock Threshold
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
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition"
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
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-800">Delete Product?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{productToDelete.name}</strong> from your
                active inventory?
              </p>
              <p className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg mt-2">
                Note: Past sales history records will remain completely intact and will not be lost.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
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
