import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const ProductCategories = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          This component is currently under development. Please check back later for category management features.
        </p>
      </CardContent>
    </Card>
  )
}

export default ProductCategories