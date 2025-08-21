"use client"

import React, { useState, useEffect } from 'react';
import { ChefHat, Search, Plus, Edit, Trash2, Save, X, Loader2, Package, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import '../styles/globals.css'
const UpdateItem = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: ''
  });

  // Available categories
  const categories = ['Starter', 'Main Course', 'Dessert', 'Beverages', 'Snacks'];

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch items and setup real-time subscription
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();

    // Clearer real-time subscription setup
    const channel = supabase
      .channel('menu_realtime_updates')  // More descriptive channel name
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all changes
          schema: 'public',
          table: 'menu',
        },
        (payload) => {
          console.log('Realtime change received:', payload);  // Debug log
          
          // Enhanced payload handling
          switch (payload.eventType) {
            case 'INSERT':
              setItems(prev => [...prev, payload.new]);
              setSuccess(`Item added: ${payload.new.name}`);
              break;
              
            case 'UPDATE':
              setItems(prev =>
                prev.map(item =>
                  item.id === payload.new.id ? payload.new : item
                )
              );
              setSuccess(`Item updated: ${payload.new.name}`);
              break;
              
            case 'DELETE':
              setItems(prev => prev.filter(item => item.id !== payload.old.id));
              setSuccess(`Item deleted`);
              break;
              
            default:
              console.log('Unknown event type:', payload.eventType);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      setError('All fields are required');
      return;
    }

    setProcessing(prev => ({ ...prev, add: true }));
    try {
      const { error } = await supabase
        .from('menu')
        .insert([{
          name: formData.name.trim(),
          price: parseInt(formData.price),
          category: formData.category
        }]);

      if (error) throw error;

      setSuccess('Item added successfully');
      setFormData({ name: '', price: '', category: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Failed to add item');
    } finally {
      setProcessing(prev => ({ ...prev, add: false }));
    }
  };

  // Update existing item
  const handleUpdateItem = async (id) => {
    if (!formData.name || !formData.price || !formData.category) {
      setError('All fields are required');
      return;
    }

    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase
        .from('menu')
        .update({
          name: formData.name.trim(),
          price: parseInt(formData.price),
          category: formData.category
        })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Item updated successfully');
      setEditingItem(null);
      setFormData({ name: '', price: '', category: '' });
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setProcessing(prev => ({ ...prev, [`delete_${id}`]: true }));
    try {
      const { error } = await supabase
        .from('menu')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    } finally {
      setProcessing(prev => ({ ...prev, [`delete_${id}`]: false }));
    }
  };

  // Start editing an item
  const startEditing = (item) => {
    setEditingItem(item.id);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category
    });
    setShowAddForm(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', category: '' });
  };

  // Start adding new item
  const startAdding = () => {
    setShowAddForm(true);
    setEditingItem(null);
    setFormData({ name: '', price: '', category: '' });
  };

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Visibility

  const visibilityMode = async(visibilityId,visibility)=>{
   const {error} = await supabase
   .from('menu')
   .update({Visibility:!visibility})
   .eq("id",visibilityId);

   if(error){
    console.log('There is error while updating the visibility');
    return;
   }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg shadow">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h1 className={`font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              Annas Cafe - Menu Management
            </h1>
          </div>

          <button
            onClick={startAdding}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg font-medium shadow-md transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            {!isMobile && 'Add Item'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Alert Messages */}
        {(error || success) && (
          <div className={`slide-in flex items-center gap-3 p-4 mb-6 rounded-lg shadow-md ${
            error ? 'bg-red-50 border-l-4 border-red-500 text-red-700' : 'bg-green-50 border-l-4 border-green-500 text-green-700'
          }`}>
            <AlertCircle className={`w-6 h-6 ${error ? 'text-red-500' : 'text-green-500'}`} />
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-6 items-end'}`}>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm text-black placeholder-black-600 "
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white text-gray-800"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="slide-in bg-white rounded-xl shadow-xl p-6 mb-8 border-l-4 border-amber-500">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Add New Menu Item</h3>
            
            <form onSubmit={handleAddItem}>
              <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-6'} mb-6`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ">Item Name *</label>
                  <input
                    type="text"
                    placeholder="Enter item name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-black placeholder-black-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none placeholder-black text-black text-black-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white text-gray-800"
                  >
                    <option value="" className="text-gray-400">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-2 px-5 rounded-lg font-medium shadow transition-all"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={processing.add}
                  className={`flex items-center gap-2 py-2 px-5 rounded-lg font-medium shadow transition-all ${
                    processing.add ? 'bg-amber-500 opacity-80 cursor-wait' : 'bg-amber-500 hover:bg-amber-600'
                  } text-white`}
                >
                  {processing.add ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {processing.add ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-semibold text-gray-800">
              Menu Items ({filteredItems.length})
            </h2>

          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-6 hover:bg-amber-50 transition-colors duration-200"
                >
                  {editingItem === item.id ? (
                    // Edit Form
                    <div className="fade-in">
                      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-6'} mb-6`}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full p-3 border-2 border-amber-500 rounded-lg outline-none text-black placeholder-black-600 "
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                            className="w-full p-3 border-2 border-amber-500 rounded-lg outline-none text-black placeholder-black-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className="w-full p-3 border-2 border-amber-500 rounded-lg outline-none bg-white text-gray-800"
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium shadow transition-all"
                        >
                          <X className="w-5 h-5" />
                          Cancel
                        </button>

                        <button
                          onClick={() => handleUpdateItem(item.id)}
                          disabled={processing[item.id]}
                          className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium shadow transition-all ${
                            processing[item.id] ? 'bg-amber-500 opacity-80 cursor-wait' : 'bg-amber-500 hover:bg-amber-600'
                          } text-white`}
                        >
                          {processing[item.id] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          {processing[item.id] ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-bold text-amber-600">
                            ₹{item.price}
                          </span>
                          <span className="bg-amber-100 text-amber-800 py-1 px-3 rounded-full text-xs font-semibold">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                      <button
                          onClick={()=>visibilityMode(item.id,item.Visibility)}
  
                          className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium shadow transition-all ${
                            editingItem !== null ? 'bg-blue-500 opacity-50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                          } text-white`}
                        >
                          
                          {item.Visibility?'Visible':'Not Visible'}
                        </button>
                        <button
                          onClick={() => startEditing(item)}
                          disabled={editingItem !== null}
                          className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium shadow transition-all ${
                            editingItem !== null ? 'bg-blue-500 opacity-50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                          } text-white`}
                        >
                          <Edit className="w-5 h-5" />
                          {!isMobile && 'Edit'}
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={processing[`delete_${item.id}`] || editingItem !== null}
                          className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium shadow transition-all ${
                            processing[`delete_${item.id}`] || editingItem !== null ? 'bg-red-500 opacity-50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                          } text-white`}
                        >
                          {processing[`delete_${item.id}`] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                          {!isMobile && (processing[`delete_${item.id}`] ? 'Deleting...' : 'Delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-black-600 mb-2">
                {searchTerm || selectedCategory !== 'all' ? 'No matching items found' : 'Your menu is empty'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' ? 'Try different search terms or filters' : 'Get started by adding your first menu item'}
              </p>
              {(!searchTerm && selectedCategory === 'all') && (
                <button
                  onClick={startAdding}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Item
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UpdateItem;
