const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('products').select('*').eq('active', true);
    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.sort === 'low') query = query.order('price', { ascending: true });
    else if (req.query.sort === 'high') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json({ products: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ product: data });
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

// POST add product (admin only)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, mrp, category, sizes, stock, size_stock, colors } = req.body;

    // Image upload
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer);
          imageUrls.push(result.secure_url);
        } catch(imgErr) {
          console.log('⚠️ Image upload failed:', imgErr.message);
        }
      }
    }

    // Parse size_stock
    let parsedSizeStock = {};
    if (size_stock) {
      try { parsedSizeStock = JSON.parse(size_stock); } catch(e) {}
    }

    // Parse sizes
    let parsedSizes = ['S','M','L','XL','XXL'];
    if (sizes) {
      try { parsedSizes = JSON.parse(sizes); } catch(e) {}
    }

    // Parse colors
    let parsedColors = [];
    if (colors) {
      try { parsedColors = JSON.parse(colors); } catch(e) {}
    }

    // Auto calculate total stock from size_stock if available
    const totalStock = Object.keys(parsedSizeStock).length > 0
      ? Object.values(parsedSizeStock).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)
      : parseInt(stock) || 0;

    const productData = {
      name,
      description: description || '',
      price: parseFloat(price),
      mrp: parseFloat(mrp) || parseFloat(price),
      category,
      sizes: parsedSizes,
      size_stock: parsedSizeStock,
      colors: parsedColors,
      stock: totalStock,
      images: imageUrls,
      active: true,
      created_at: new Date()
    };

    console.log('💾 Inserting product:', productData.name);

    const { data, error } = await supabase.from('products').insert([productData]).select();

    if (error) {
      console.log('❌ Supabase error:', error.message);
      throw error;
    }

    console.log('✅ Product added:', data[0]?.id);
    res.status(201).json({ message: 'Product added!', product: data[0] });
  } catch (err) {
    console.log('❌ Product add error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update product (admin only)
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, mrp, category, stock, active, sizes, size_stock, colors } = req.body;

    const updates = {
      name,
      description: description || '',
      price: parseFloat(price),
      mrp: parseFloat(mrp) || parseFloat(price),
      category,
      active: active === 'true',
      updated_at: new Date()
    };

    // Parse sizes
    if (sizes) {
      try { updates.sizes = JSON.parse(sizes); } catch(e) {}
    }

    // Parse size_stock
    if (size_stock) {
      try {
        const parsedSizeStock = JSON.parse(size_stock);
        updates.size_stock = parsedSizeStock;
        updates.stock = Object.values(parsedSizeStock)
          .reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
      } catch(e) {
        updates.stock = parseInt(stock) || 0;
      }
    } else {
      updates.stock = parseInt(stock) || 0;
    }

    // Parse colors
    if (colors) {
      try { updates.colors = JSON.parse(colors); } catch(e) {}
    }

    // Upload new images if provided
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer);
          imageUrls.push(result.secure_url);
        } catch(imgErr) {
          console.log('⚠️ Image upload failed:', imgErr.message);
        }
      }
      if (imageUrls.length > 0) updates.images = imageUrls;
    }

    console.log('💾 Updating product:', req.params.id);

    const { data, error } = await supabase
      .from('products').update(updates).eq('id', req.params.id).select();

    if (error) {
      console.log('❌ Supabase update error:', error.message);
      throw error;
    }

    console.log('✅ Product updated:', data[0]?.id);
    res.json({ message: 'Product updated!', product: data[0] });
  } catch (err) {
    console.log('❌ Product update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE product (admin only — soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products').update({ active: false }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product removed!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;