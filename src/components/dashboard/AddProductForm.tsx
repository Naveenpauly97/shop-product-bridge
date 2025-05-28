
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Beauty & Health',
  'Toys & Games',
  'Food & Beverages',
  'Automotive',
  'Other'
];

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    productName: '',
    productDesc: '',
    productCategory: '',
    productPrice: '',
    productStock: '',
    productSku: '',
    productImageUrl: '',
    productStatus: 'active'
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          ownr_id: user.id,
          prdt_name: formData.productName,
          prdt_desc: formData.productDesc,
          product_category: formData.productCategory || null,
          product_price: formData.productPrice ? parseFloat(formData.productPrice) : null,
          product_stock: formData.productStock ? parseInt(formData.productStock) : 0,
          product_sku: formData.productSku || null,
          product_image_url: formData.productImageUrl || null,
          product_status: formData.productStatus,
        });

      if (error) throw error;

      toast({
        title: "Product added",
        description: "Your product has been successfully added.",
      });

      // Reset form
      setFormData({
        productName: '',
        productDesc: '',
        productCategory: '',
        productPrice: '',
        productStock: '',
        productSku: '',
        productImageUrl: '',
        productStatus: 'active'
      });
      
      // Trigger a page refresh to show the new product
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            type="text"
            placeholder="Enter product name"
            value={formData.productName}
            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="productSku">SKU</Label>
          <Input
            id="productSku"
            type="text"
            placeholder="Product SKU"
            value={formData.productSku}
            onChange={(e) => setFormData(prev => ({ ...prev, productSku: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productDesc">Description</Label>
        <Textarea
          id="productDesc"
          placeholder="Enter product description"
          value={formData.productDesc}
          onChange={(e) => setFormData(prev => ({ ...prev, productDesc: e.target.value }))}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productCategory">Category</Label>
          <Select 
            value={formData.productCategory} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, productCategory: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productPrice">Price ($)</Label>
          <Input
            id="productPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.productPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, productPrice: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="productStock">Stock Quantity</Label>
          <Input
            id="productStock"
            type="number"
            min="0"
            placeholder="0"
            value={formData.productStock}
            onChange={(e) => setFormData(prev => ({ ...prev, productStock: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productImageUrl">Image URL</Label>
        <Input
          id="productImageUrl"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={formData.productImageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, productImageUrl: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productStatus">Status</Label>
        <Select 
          value={formData.productStatus} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, productStatus: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding Product...' : 'Add Product'}
      </Button>
    </form>
  );
};
