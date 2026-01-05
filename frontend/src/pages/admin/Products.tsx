import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, CheckCircle2, XCircle, X, Sparkles, Tag, FileText } from 'lucide-react';
import api from '../../lib/axios';
import { PremiumHeader, AnimatedStatCard, FloatingOrbs, GridBackground, PremiumCard } from '../../components/premium';

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/products', formData);
      setShowModal(false);
      setFormData({ code: '', name: '', description: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const activeProducts = products.filter(p => p.is_active).length;
  const inactiveProducts = products.filter(p => !p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <PremiumHeader
        icon={Package}
        title={t('admin.products')}
        subtitle={t('admin.manageProducts')}
        badge="Catálogo de Produtos"
        iconColor="from-purple-500 to-purple-700"
        actions={
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('admin.newProduct')}
          </motion.button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedStatCard
          icon={Package}
          label={t('admin.totalProducts')}
          value={products.length}
          color="from-purple-500 to-purple-700"
          delay={0}
        />
        <AnimatedStatCard
          icon={CheckCircle2}
          label={t('admin.activeProducts')}
          value={activeProducts}
          color="from-green-500 to-emerald-600"
          delay={0.1}
        />
        <AnimatedStatCard
          icon={XCircle}
          label={t('admin.inactiveProducts')}
          value={inactiveProducts}
          color="from-red-500 to-red-700"
          delay={0.2}
        />
      </div>

      {/* Products Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
            />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden backdrop-blur-xl rounded-2xl p-12 text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}
          >
            <FloatingOrbs variant="subtle" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, delay: 0.2 }}
            >
              <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('admin.noProductsRegistered')}
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('admin.createFirstProduct')}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-600/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('admin.newProduct')}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className={`relative backdrop-blur-xl rounded-2xl p-6 hover:border-purple-500/30 transition-all h-full ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/50"
                    >
                      <Package className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {product.is_active ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {product.is_active ? t('common.active') : t('common.inactive')}
                    </motion.span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{t('admin.productCode')}</span>
                    </div>
                    <p className="font-mono text-purple-400 font-medium">{product.code}</p>
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>
                  
                  <p className={`text-sm line-clamp-2 min-h-[2.5rem] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {product.description || (
                      <span className="text-gray-600 italic">{t('admin.noDescription')}</span>
                    )}
                  </p>
                  
                  <div className={`mt-4 pt-4 flex items-center gap-2 text-gray-500 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-100'}`}>
                    <FileText className="w-3 h-3" />
                    <span className="text-xs">
                      {t('courses.createdAt')} {new Date(product.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create Product Modal */}
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
              className={`relative backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${isDark ? 'bg-gray-900/95 border border-white/10' : 'bg-white border border-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden">
                <GridBackground opacity={0.2} color="139, 92, 246" />
                <div className={`relative flex items-center justify-between px-6 py-4 ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('admin.createNewProduct')}</h2>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Adicionar novo produto ao catálogo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('admin.productCode')} *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                    placeholder="Ex: CARTOES, CREDITO, SEGUROS"
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('admin.productName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                    placeholder="Nome do produto"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('courses.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                    placeholder="Descrição do produto (opcional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium ${isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:shadow-purple-600/30 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('admin.createProduct')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
