import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, CheckCircle2, XCircle, X, Sparkles, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs, GridBackground } from '../../components/premium';
import { getTranslatedProductName } from '../../utils/productTranslation';

interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormError('');
    setFormData({ code: '', name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormError('');
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || '',
      is_active: product.is_active
    });
    setShowModal(true);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingProduct) {
        // Atualizar produto existente (sem enviar código)
        const { code, ...updateData } = formData;
        await api.put(`/api/admin/products/${editingProduct.id}`, updateData);
      } else {
        // Criar novo produto (código opcional, será gerado se vazio)
        const createData = formData.code ? formData : { name: formData.name, description: formData.description };
        await api.post('/api/admin/products', createData);
      }
      setShowModal(false);
      setFormData({ code: '', name: '', description: '', is_active: true });
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      setFormError(error.response?.data?.detail || 'Erro ao salvar produto');
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await api.delete(`/api/admin/products/${deletingProduct.id}`);
      setShowDeleteModal(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setDeleteError(error.response?.data?.detail || 'Erro ao excluir produto');
    }
  };

  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={Package}
        title={t('admin.products')}
        subtitle={t('admin.manageProducts')}
        badge="Gestão de Produtos"
        iconColor="from-orange-500 to-orange-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('admin.newProduct')}
          </motion.button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedStatCard
          icon={Package}
          label={t('admin.totalProducts')}
          value={products.length}
          color="from-orange-500 to-orange-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={CheckCircle2}
          label={t('admin.activeProducts')}
          value={activeProducts}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-purple-600/5 rounded-2xl" />
        <FloatingOrbs variant="subtle" />
        
        <div className="relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
              />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">{t('admin.noProductsRegistered')}</p>
              <p className="text-gray-500 mt-2">{t('admin.createFirstProduct')}</p>
            </div>
          ) : (
            <motion.table
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.productCode')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.productName')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.productDescription')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('courses.createdAt')}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((product) => (
                  <motion.tr
                    key={product.id}
                    variants={rowVariants}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-orange-600 dark:text-orange-400 font-medium">{product.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {getTranslatedProductName(t, product.code, product.name)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {product.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {product.is_active ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {product.is_active ? t('common.active') : t('common.inactive')}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(product.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenDeleteModal(product)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </div>
      </motion.div>

      {/* Create/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden">
                <GridBackground opacity={0.2} />
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {editingProduct ? t('admin.editProduct') : t('admin.createNewProduct')}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {editingProduct ? 'Alterar informações do produto' : 'Preencha os dados do produto'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {formError}
                  </div>
                )}
                {editingProduct ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.productCode')}
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 font-mono">
                      {editingProduct.code}
                      <span className="text-xs ml-2 text-gray-400">(não editável)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.productCode')}
                      <span className="text-xs ml-2 text-gray-400">(opcional - será gerado automaticamente se vazio)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono"
                      placeholder="Ex: CARD001, FOREX01"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.productName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder={t('admin.productNamePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.productDescription')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    placeholder="Descrição do produto (opcional)"
                    rows={3}
                  />
                </div>
                {editingProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.status')}
                    </label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        formData.is_active 
                          ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400' 
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          checked={formData.is_active}
                          onChange={() => setFormData({ ...formData, is_active: true })}
                          className="sr-only"
                        />
                        <CheckCircle2 className="w-4 h-4" />
                        {t('common.active')}
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        !formData.is_active 
                          ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' 
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="status"
                          checked={!formData.is_active}
                          onChange={() => setFormData({ ...formData, is_active: false })}
                          className="sr-only"
                        />
                        <XCircle className="w-4 h-4" />
                        {t('common.inactive')}
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-medium"
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:shadow-lg hover:shadow-orange-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {editingProduct ? t('common.save') : t('admin.createProduct')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('admin.deleteProduct')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('admin.deleteProductConfirm')}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {deletingProduct.code} - {getTranslatedProductName(t, deletingProduct.code, deletingProduct.name)}
                </p>
                
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {deleteError}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-medium"
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg hover:shadow-red-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
