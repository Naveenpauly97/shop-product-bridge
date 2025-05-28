
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package, Edit, Eye, AlertTriangle } from 'lucide-react';

interface Product {
  prdt_id: number;
  prdt_name: string;
  prdt_desc: string;
  created_at: string;
  product_category: string | null;
  product_price: number | null;
  product_stock: number | null;
  product_sku: string | null;
  product_image_url: string | null;
  product_status: string | null;
}

interface ProductListProps {
  limit?: number;
  showActions?: boolean;
  showInventory?: boolean;
}

export const ProductList = ({ limit, showActions = true, showInventory = false }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('ownr_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('prdt_id', productId);

      if (error) throw error;
      
      setProducts(products.filter(p => p.prdt_id !== productId));
      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLowStock = (stock: number | null) => {
    return (stock || 0) < 10;
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500">Get started by adding your first product.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.prdt_id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{product.prdt_name}</CardTitle>
                {product.product_sku && (
                  <p className="text-sm text-gray-500 mt-1">SKU: {product.product_sku}</p>
                )}
              </div>
              {showActions && (
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteProduct(product.prdt_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {product.product_image_url && (
              <img 
                src={product.product_image_url} 
                alt={product.prdt_name}
                className="w-full h-32 object-cover rounded-md mb-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            
            <p className="text-gray-600 mb-3 text-sm line-clamp-2">{product.prdt_desc}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                {product.product_category && (
                  <Badge variant="outline">{product.product_category}</Badge>
                )}
                {product.product_status && (
                  <Badge className={getStatusColor(product.product_status)}>
                    {product.product_status}
                  </Badge>
                )}
              </div>
              
              {(product.product_price !== null || showInventory) && (
                <div className="flex justify-between text-sm">
                  {product.product_price !== null && (
                    <span className="font-semibold text-green-600">
                      ${product.product_price.toFixed(2)}
                    </span>
                  )}
                  {showInventory && (
                    <span className={`flex items-center ${isLowStock(product.product_stock) ? 'text-orange-600' : 'text-gray-600'}`}>
                      {isLowStock(product.product_stock) && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      Stock: {product.product_stock || 0}
                    </span>
                  )}
                </div>
              )}
              
              {!showActions && (
                <Badge variant="secondary" className="text-xs">
                  {new Date(product.created_at).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
