
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Package } from 'lucide-react';

interface Product {
  prdt_id: number;
  prdt_name: string;
  prdt_desc: string;
  created_at: string;
}

export const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('ownr_id', user.id)
        .order('created_at', { ascending: false });

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
              <CardTitle className="text-lg">{product.prdt_name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteProduct(product.prdt_id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">{product.prdt_desc}</p>
            <Badge variant="secondary">
              {new Date(product.created_at).toLocaleDateString()}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
