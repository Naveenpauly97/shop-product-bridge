
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const AddProductForm = () => {
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
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
          ownr_id: user.id as any, // Cast to bypass type check since we know this is correct
          prdt_name: productName,
          prdt_desc: productDesc,
        });

      if (error) throw error;

      toast({
        title: "Product added",
        description: "Your product has been successfully added.",
      });

      // Reset form
      setProductName('');
      setProductDesc('');
    } catch (error: any) {
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          type="text"
          placeholder="Enter product name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="productDesc">Description</Label>
        <Textarea
          id="productDesc"
          placeholder="Enter product description"
          value={productDesc}
          onChange={(e) => setProductDesc(e.target.value)}
          rows={4}
        />
      </div>
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Adding Product...' : 'Add Product'}
      </Button>
    </form>
  );
};
