import { useState } from "react"
import { useCurrency } from "@/contexts/currency-context"
import Image from "next/image"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Badge } from "@/components/dashboard/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Search, AlertTriangle, Edit, ShoppingCart, Heart, Filter, Check, X, Star } from 'lucide-react'
import { useCustomColors } from "@/lib/use-custom-colors"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  status: "Available" | "Out of Stock"
  image: string
  sales: number
  rating?: number
}

interface ProductsGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onEdit: (product: Product) => void
}

export function ProductsGrid({ products, onAddToCart, onEdit }: ProductsGridProps) {
  const { currency } = useCurrency();
  const { primaryColor, secondaryColor } = useCustomColors();
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [pendingCategories, setPendingCategories] = useState<string[]>([])
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null)

  const categories = Array.from(new Set(products.map((p) => p.category)))
  
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category)
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleCategory = (category: string) => {
    setPendingCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const applyFilters = () => {
    setSelectedCategories(pendingCategories)
    setFilterDropdownOpen(false)
    setFilterAction("applied")
  }

  const clearFilters = () => {
    setPendingCategories([])
    setSelectedCategories([])
    setFilterDropdownOpen(false)
    setFilterAction("cleared")
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-4 flex-1">
            <div className="relative flex-1 min-w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white h-4 w-4" />
              <Input
                placeholder="Search services and products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:text-white dark:placeholder:text-white border-gray-200 dark:border-gray-700"
              />
            </div>
            
            {/* Filter Button with Popover */}
            <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-white transition-smooth relative h-12 px-4"
                >
                  <span className="relative inline-block">
                    <Filter className="h-4 w-4" style={{ color: primaryColor }} />
                    {filterAction === "applied" && selectedCategories.length > 0 && (
                      <span className="absolute -top-1 -right-1">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500">
                          <Check className="w-2 h-2 text-white" />
                        </span>
                      </span>
                    )}
                    {filterAction === "cleared" && (
                      <span className="absolute -top-1 -right-1">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500">
                          <X className="w-2 h-2 text-white" />
                        </span>
                      </span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Filter by Category</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {categories.map((category) => (
                        <label
                          key={category}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={pendingCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="w-4 h-4 border-gray-300 rounded"
                            style={{ accentColor: primaryColor }}
                          />
                          <span className="text-sm text-gray-700 dark:text-white">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Button
                      size="sm"
                      className="flex-1 text-white"
                      style={{ backgroundColor: primaryColor }}
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              style={{ 
                borderColor: `${secondaryColor}50`, 
                color: secondaryColor 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${secondaryColor}10`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              className="transition-smooth"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-orange-300 hover-lift group shadow-sm hover:shadow-lg transition-smooth"
            onMouseEnter={() => setHoveredProductId(product.id)}
            onMouseLeave={() => setHoveredProductId(null)}
          >
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-smooth"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />

              {/* Quick Actions */}
              {hoveredProductId === product.id && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="text-white transition-smooth"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => onEdit(product)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="text-white transition-smooth"
                    style={{ backgroundColor: secondaryColor }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    onClick={() => onAddToCart(product)}
                    title="Add to Cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/80 bg-white/20 hover:bg-white/30 text-white transition-smooth"
                    title="Wishlist"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Status Badge */}
              <Badge
                className={`absolute top-4 right-4 ${
                  product.status === "Available"
                    ? "bg-green-500/90 hover:bg-green-600 text-white"
                    : "bg-red-500/90 hover:bg-red-600 text-white"
                } transition-smooth`}
              >
                {product.status}
              </Badge>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600 dark:text-white mb-3 line-clamp-2">{product.description}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300 dark:text-white"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-white font-medium">{product.rating || 0}</span>
              </div>

              {/* Category Badge */}
              <Badge variant="outline" className="mb-3" style={{ borderColor: primaryColor, color: primaryColor }}>
                {product.category}
              </Badge>

              {/* Price and Stock */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold gradient-text">{currency} {product.price}</span>
                  <span className="text-sm text-gray-600 dark:text-white">Stock: {product.stock}</span>
                </div>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white pb-3 border-t border-gray-200 pt-3">
                <span>{product.sales} sold</span>
                <span style={{ color: secondaryColor }}>⚡</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
