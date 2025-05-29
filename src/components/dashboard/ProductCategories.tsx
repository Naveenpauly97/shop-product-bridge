
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Search } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface CategoryStats {
  category: string
  count: number
  totalValue: number
}

export const ProductCategories = () => {
  const { user } = useAuth()
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoryStats()
  }, [user])

  const fetchCategoryStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('product_category, product_price, product_stock')
        .eq('ownr_id', user.id)

      if (error) throw error

      // Group products by category and calculate stats
      const categoryMap = new Map<string, { count: number; totalValue: number }>()
      
      data?.forEach((product) => {
        const category = product.product_category || 'Uncategorized'
        const price = parseFloat(product.product_price?.toString() || '0')
        const stock = parseInt(product.product_stock?.toString() || '0')
        const value = price * stock

        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category)!
          categoryMap.set(category, {
            count: existing.count + 1,
            totalValue: existing.totalValue + value
          })
        } else {
          categoryMap.set(category, {
            count: 1,
            totalValue: value
          })
        }
      })

      const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(
        ([category, stats]) => ({
          category,
          count: stats.count,
          totalValue: stats.totalValue
        })
      )

      // Sort by count descending
      categoryStats.sort((a, b) => b.count - a.count)
      setCategories(categoryStats)
    } catch (error) {
      console.error('Error fetching category stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading categories...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Stats */}
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No categories match your search.' : 'Start by adding some products to see categories here.'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category) => (
                  <Card key={category.category} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate" title={category.category}>
                          {category.category}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {category.count} items
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Products: <span className="font-medium">{category.count}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Value: <span className="font-medium text-green-600">
                            {formatCurrency(category.totalValue)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary */}
            {categories.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                      <div className="text-sm text-blue-700">Categories</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {categories.reduce((sum, cat) => sum + cat.count, 0)}
                      </div>
                      <div className="text-sm text-blue-700">Total Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(categories.reduce((sum, cat) => sum + cat.totalValue, 0))}
                      </div>
                      <div className="text-sm text-blue-700">Total Value</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat.count, 0) / categories.length) : 0}
                      </div>
                      <div className="text-sm text-blue-700">Avg per Category</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductCategories
