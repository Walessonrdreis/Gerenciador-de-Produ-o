import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Plus, Trash2, AlertCircle, X, Layers, Settings, BarChart3 } from 'lucide-react';
import { Product } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useOmieProducts, useOmieFamilies } from '../api/omie/queries';
import { cn } from '../lib/utils';

export default function ProductsView() {
  const products = useAppStore(state => state.products);
  const setProducts = useAppStore(state => state.setProducts);
  const materials = useAppStore(state => state.materials);
  const addProduct = useAppStore(state => state.addProduct);
  const updateProduct = useAppStore(state => state.updateProduct);
  const removeProduct = useAppStore(state => state.removeProduct);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [omieFamilyFilter, setOmieFamilyFilter] = useState<number | null>(null);
  const [omieSearch, setOmieSearch] = useState('');
  const [selectedOmieProducts, setSelectedOmieProducts] = useState<Set<number>>(new Set());
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', capacityCost: 1, materials: [] });

  const { data: omieFamilies, isLoading: isLoadingOmieFamilies, error: omieFamiliesError } = useOmieFamilies({ enabled: isImporting });
  const { data: omieProducts, isLoading: isLoadingOmie, error: omieError } = useOmieProducts(1, omieSearch, omieFamilyFilter, { enabled: isImporting });

  const handleAddProduct = () => {
    if (newProduct.name) {
      addProduct({ ...newProduct, id: Math.random().toString(36).substr(2, 9) } as Product);
      setIsAdding(false);
      setNewProduct({ name: '', capacityCost: 1, materials: [] });
    }
  };

  const handleUpdateProduct = () => {
    if (editingProduct) {
      updateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const toggleOmieSelection = (code: number) => {
    setSelectedOmieProducts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAllOmieProducts = () => {
    if (omieProducts) {
      setSelectedOmieProducts(new Set(omieProducts.map(p => p.codigo_produto)));
    }
  };

  const clearOmieSelection = () => {
    setSelectedOmieProducts(new Set());
  };

  const importSelectedFromOmie = () => {
    if (!omieProducts) return;
    const toAdd = omieProducts
      .filter(p => selectedOmieProducts.has(p.codigo_produto))
      .filter(p => !products.some(existing => existing.id === `omie-${p.codigo_produto}` || existing.name === p.descricao))
      .map(p => ({
        id: `omie-${p.codigo_produto}`,
        name: p.descricao,
        capacityCost: 1, // Default capacity cost
        materials: [] // Needs to be configured later
      } as Product));

    if (toAdd.length > 0) {
      setProducts([...products, ...toAdd]);
    }
    
    setIsImporting(false);
    clearOmieSelection();
  };

  const openOmieImport = () => {
    setIsImporting(true);
    clearOmieSelection();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h3 className="text-xl font-bold">Catálogo de Produtos</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              openOmieImport();
            }}
            className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#F7F0E4] transition-colors shadow-sm"
          >
            <Layers size={20} /> Importar Omie
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#4A2C2A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3A2220] transition-colors shadow-lg shadow-[#4A2C2A]/20"
          >
            <Plus size={20} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingProduct(product)}
                className="text-[#8B5E3C] hover:text-[#4A2C2A]"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir este produto?')) {
                    removeProduct(product.id);
                  }
                }}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="w-12 h-12 bg-[#F7F0E4] rounded-2xl flex items-center justify-center text-[#4A2C2A] mb-4">
              <Package size={24} />
            </div>
            <h4 className="font-bold text-lg">{product.name}</h4>
            <p className="text-sm text-[#8B5E3C] mb-4">Custo de Capacidade: {product.capacityCost} un/dia</p>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-wider">Ingredientes</p>
              {product.materials.map(m => {
                const mat = materials.find(rm => rm.id === m.materialId);
                return (
                  <div key={m.materialId} className="flex justify-between text-xs py-1 border-b border-[#F7F0E4] last:border-0">
                    <span>{mat?.name}</span>
                    <span className="font-medium">{m.amount}{mat?.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Adicionar Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                  placeholder="Ex: Trufa de Avelã"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Custo de Capacidade</label>
                <input 
                  type="number" 
                  value={newProduct.capacityCost}
                  onChange={(e) => setNewProduct({...newProduct, capacityCost: Number(e.target.value)})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddProduct}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Editar Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Custo de Capacidade</label>
                <input 
                  type="number" 
                  value={editingProduct.capacityCost}
                  onChange={(e) => setEditingProduct({...editingProduct, capacityCost: Number(e.target.value)})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Ingredientes (kg/unidade)</label>
                {materials.map(mat => {
                  const currentMat = editingProduct.materials.find(m => m.materialId === mat.id);
                  return (
                    <div key={mat.id} className="flex items-center gap-3">
                      <span className="text-xs flex-1">{mat.name}</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={currentMat?.amount || 0}
                        onChange={(e) => {
                          const amount = Number(e.target.value);
                          const newMats = [...editingProduct.materials];
                          const index = newMats.findIndex(m => m.materialId === mat.id);
                          if (index >= 0) {
                            newMats[index] = { ...newMats[index], amount };
                          } else {
                            newMats.push({ materialId: mat.id, amount });
                          }
                          setEditingProduct({ ...editingProduct, materials: newMats });
                        }}
                        className="w-20 bg-[#FDFBF7] border border-[#E8DCC4] rounded-lg px-2 py-1 text-sm"
                      />
                      <span className="text-[10px] text-[#8B5E3C]">{mat.unit}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateProduct}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Importar do Omie</h3>
              <button onClick={() => setIsImporting(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar por nome..."
                  value={omieSearch}
                  onChange={(e) => setOmieSearch(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
                <BarChart3 size={18} className="absolute left-3 top-2.5 text-[#8B5E3C]" />
              </div>
              <select
                className="bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                value={omieFamilyFilter || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setOmieFamilyFilter(value);
                }}
                disabled={isLoadingOmieFamilies}
              >
                <option value="">Todas as categorias</option>
                {omieFamilies?.map(f => (
                  <option key={f.codigo} value={f.codigo}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {omieFamiliesError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <AlertCircle size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Categorias do Omie</p>
                    <p className="text-xs mt-0.5 break-words">{omieFamiliesError.message}</p>
                  </div>
                </div>
              )}
              {omieError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <AlertCircle size={20} />
                  <p className="text-sm">{omieError.message}</p>
                </div>
              )}
              {!isLoadingOmie && !omieError && omieProducts?.length === 0 && (omieSearch.trim() || omieFamilyFilter) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <AlertCircle size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Filtro não retornou produtos</p>
                    <p className="text-xs mt-0.5 break-words">
                      {omieFamilyFilter ? `Categoria: ${omieFamilies?.find(f => f.codigo === omieFamilyFilter)?.nome || '—'} (${omieFamilyFilter})` : 'Categoria: todas'}{omieSearch.trim() ? ` | Busca: "${omieSearch.trim()}"` : ''}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => {
                          setOmieFamilyFilter(null);
                        }}
                        className="bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                      >
                        Buscar sem categoria
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoadingOmie ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#8B5E3C]">
                  <div className="w-8 h-8 border-4 border-[#4A2C2A] border-t-transparent rounded-full animate-spin mb-4" />
                  <p>Carregando produtos do Omie...</p>
                </div>
              ) : omieProducts?.length === 0 ? (
                <div className="text-center py-12 text-[#8B5E3C]">Nenhum produto encontrado.</div>
              ) : (
                omieProducts?.map(p => (
                  <div
                    key={p.codigo_produto}
                    onClick={() => toggleOmieSelection(p.codigo_produto)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 bg-[#FDFBF7] border rounded-2xl transition-colors group text-left cursor-pointer",
                      selectedOmieProducts.has(p.codigo_produto) ? "border-[#4A2C2A] shadow-md shadow-[#4A2C2A]/10" : "border-[#E8DCC4] hover:border-[#4A2C2A]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOmieProducts.has(p.codigo_produto)}
                        onChange={() => toggleOmieSelection(p.codigo_produto)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 rounded border-[#E8DCC4] text-[#4A2C2A] focus:ring-[#4A2C2A]"
                      />
                      <div>
                        <p className="font-bold text-[#4A2C2A]">{p.descricao}</p>
                        <p className="text-xs text-[#8B5E3C]">Código: {p.codigo_produto_integracao} | Unidade: {p.unidade}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                      selectedOmieProducts.has(p.codigo_produto)
                        ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                        : "bg-white text-[#4A2C2A] border-[#E8DCC4] group-hover:border-[#4A2C2A]"
                    )}>
                      {selectedOmieProducts.has(p.codigo_produto) ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#E8DCC4] flex items-center gap-3 flex-wrap">
              <button
                onClick={selectAllOmieProducts}
                disabled={omieProducts.length === 0}
                className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl font-medium hover:bg-[#F7F0E4] transition-colors disabled:opacity-50"
              >
                Selecionar todos
              </button>
              <button
                onClick={clearOmieSelection}
                disabled={selectedOmieProducts.size === 0}
                className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl font-medium hover:bg-[#F7F0E4] transition-colors disabled:opacity-50"
              >
                Limpar
              </button>
              <div className="flex-1" />
              <button
                onClick={importSelectedFromOmie}
                disabled={selectedOmieProducts.size === 0}
                className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#3A2220] transition-colors disabled:opacity-50"
              >
                Importar ({selectedOmieProducts.size})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
