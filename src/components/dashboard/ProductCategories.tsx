
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface CategoryStats {
  category: string;
  count: number;
  totalValue: number;
}

export const ProductCategories = () => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('product_category, product_price, product_stock')
          .eq('ownr_id', user.id);

        if (error) throw error;

        // Group products by category
        const categoryMap = new Map<string, CategoryStats>();
        
        products?.forEach(product => {
          const category = product.product_category || 'Uncategorized';
          const price = product.product_price || 0;
          const stock = product.product_stock || 0;
          const value = price * stock;

          if (categoryMap.has(category)) {
            const existing = categoryMap.get(category)!;
            categoryMap.set(category, {
              category,
              count: existing.count + 1,
              totalValue: existing.totalValue + value,
            });
          } else {
            categoryMap.set(category, {
              category,
              count: 1,
              totalValue: value,
            });
          }
        });

        const categoryStats = Array.from(categoryMap.values())
          .sort((a, b) => b.count - a.count);

        setCategories(categoryStats);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4">Loading categories...</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
        <p className="text-gray-500">Add products with categories to see them organized here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.category} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              {category.category}
              <Badge variant="secondary">{category.count} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">${category.totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Value per Item:</span>
                <span className="font-medium">
                  ${(category.totalValue / category.count).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
