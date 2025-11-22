"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { HeroSection } from "@/components/dashboard/sell-products/hero-section"
import { ProductsGrid } from "@/components/dashboard/sell-products/products-grid"
import { SalesTable } from "@/components/dashboard/sell-products/sales-table"
import { AnalyticsDashboard } from "@/components/dashboard/sell-products/analytics-dashboard"
import { Dialogs } from "@/components/dashboard/sell-products/dialogs"
import { Button } from "@/components/dashboard/ui/button"
import { X } from 'lucide-react'

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

interface Sale {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: { productId: string; productName?: string; quantity: number; price: number }[]
  total: number
  tax: number
  discount: number
  finalAmount: number
  paymentMethod: string
  status: "Completed" | "Pending" | "Failed"
  date: string
  invoiceNumber: string
}

export default function ProductsServicesPage() {
  const [currentView, setCurrentView] = useState<"products" | "sales" | "analytics">("analytics")
  
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [showAIImageDialog, setShowAIImageDialog] = useState(false)
  const [showEditImageDialog, setShowEditImageDialog] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([])

  const [products] = useState<Product[]>([
    {
      id: "P001",
      name: "Art Supplies Kit",
      description: "Complete art supplies for beginners with premium materials",
      category: "Art Materials",
      price: 299,
      stock: 25,
      status: "Available",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
      sales: 45,
      rating: 4.8,
    },
    {
      id: "P002",
      name: "Sports Equipment Set",
      description: "Premium sports gear for training and competitions",
      category: "Sports Equipment",
      price: 599,
      stock: 0,
      status: "Out of Stock",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop",
      sales: 32,
      rating: 4.5,
    },
    {
      id: "S001",
      name: "Private Art Lessons",
      description: "One-on-one personalized art instruction sessions",
      category: "Services",
      price: 1200,
      stock: 10,
      status: "Available",
      image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
      sales: 18,
      rating: 5.0,
    },
    {
      id: "P003",
      name: "Digital Design Course",
      description: "Complete digital design masterclass with certificates",
      category: "Courses",
      price: 899,
      stock: 5,
      status: "Available",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
      sales: 28,
      rating: 4.9,
    },
    {
      id: "P004",
      name: "Professional Soccer Ball",
      description: "FIFA approved match ball for professional games",
      category: "Sports Equipment",
      price: 450,
      stock: 15,
      status: "Available",
      image: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400&h=300&fit=crop",
      sales: 52,
      rating: 4.7,
    },
    {
      id: "P005",
      name: "Watercolor Paint Set",
      description: "Premium watercolor paints with 48 vibrant colors",
      category: "Art Materials",
      price: 350,
      stock: 30,
      status: "Available",
      image: "https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=400&h=300&fit=crop",
      sales: 67,
      rating: 4.9,
    },
    {
      id: "S002",
      name: "Personal Training Sessions",
      description: "One-on-one fitness training with certified trainers",
      category: "Services",
      price: 1500,
      stock: 8,
      status: "Available",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop",
      sales: 24,
      rating: 4.8,
    },
    {
      id: "P006",
      name: "Photography Workshop",
      description: "Advanced photography techniques and portfolio building",
      category: "Courses",
      price: 1100,
      stock: 12,
      status: "Available",
      image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop",
      sales: 35,
      rating: 5.0,
    },
  ])

  const [sales] = useState<Sale[]>([
    {
      id: "INV001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "+1234567890",
      items: [{ productId: "P001", productName: "Art Supplies Kit", quantity: 2, price: 299 }],
      total: 598,
      tax: 59.8,
      discount: 0,
      finalAmount: 657.8,
      paymentMethod: "UPI",
      status: "Completed",
      date: "2024-01-15",
      invoiceNumber: "XYZ-INV-001",
    },
    {
      id: "INV002",
      customerName: "Sarah Smith",
      customerEmail: "sarah@example.com",
      customerPhone: "+1234567891",
      items: [{ productId: "P004", productName: "Professional Soccer Ball", quantity: 1, price: 450 }],
      total: 450,
      tax: 45,
      discount: 25,
      finalAmount: 470,
      paymentMethod: "Card",
      status: "Completed",
      date: "2024-02-20",
      invoiceNumber: "XYZ-INV-002",
    },
    {
      id: "INV003",
      customerName: "Michael Chen",
      customerEmail: "michael@example.com",
      customerPhone: "+1234567892",
      items: [{ productId: "S001", productName: "Private Art Lessons", quantity: 1, price: 1200 }],
      total: 1200,
      tax: 120,
      discount: 0,
      finalAmount: 1320,
      paymentMethod: "UPI",
      status: "Pending",
      date: "2024-03-10",
      invoiceNumber: "XYZ-INV-003",
    },
    {
      id: "INV004",
      customerName: "Emily Johnson",
      customerEmail: "emily@example.com",
      customerPhone: "+1234567893",
      items: [{ productId: "P003", productName: "Digital Design Course", quantity: 1, price: 899 }],
      total: 899,
      tax: 89.9,
      discount: 50,
      finalAmount: 938.9,
      paymentMethod: "Cash",
      status: "Completed",
      date: "2024-04-05",
      invoiceNumber: "XYZ-INV-004",
    },
    {
      id: "INV005",
      customerName: "David Wilson",
      customerEmail: "david@example.com",
      customerPhone: "+1234567894",
      items: [{ productId: "P005", productName: "Watercolor Paint Set", quantity: 3, price: 350 }],
      total: 1050,
      tax: 105,
      discount: 0,
      finalAmount: 1155,
      paymentMethod: "UPI",
      status: "Completed",
      date: "2024-05-18",
      invoiceNumber: "XYZ-INV-005",
    },
  ])

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <div className="min-h-screen">
        {/* Hero Section */}
        <HeroSection
          onAddProduct={() => setShowAddProductDialog(true)}
          onAIImage={() => setShowAIImageDialog(true)}
        />

        {/* Main Content Area */}
        <div className="px-6 pb-6">
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 bg-transparent">
              <TabsTrigger
                value="analytics"
                className="text-xs border-2 border-[#DE7D14] text-[#DE7D14] bg-white transition-colors duration-150 font-semibold rounded-lg px-4 py-2 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none"
              >
                Analytics & Reports
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="text-xs border-2 border-[#DE7D14] text-[#DE7D14] bg-white transition-colors duration-150 font-semibold rounded-lg px-4 py-2 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none"
              >
                Sales & Invoices
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="text-xs border-2 border-[#DE7D14] text-[#DE7D14] bg-white transition-colors duration-150 font-semibold rounded-lg px-4 py-2 data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] focus:outline-none"
              >
                Products & Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6 mt-6">
              <ProductsGrid
                products={products}
                onAddToCart={addToCart}
                onEdit={(product) => {
                  setSelectedProduct(product)
                  setShowAddProductDialog(true)
                }}
              />
            </TabsContent>

            <TabsContent value="sales" className="space-y-6 mt-6">
              <SalesTable sales={sales} />

              {/* Shopping Cart */}
              {cart.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold gradient-text">Shopping Cart</h2>
                    <Button
                      onClick={() => setShowCheckoutDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white transition-smooth glow"
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.product.image || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">₹{item.product.price} each</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-700">Qty: {item.quantity}</span>
                          <span className="font-semibold gradient-text text-lg">₹{item.product.price * item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCart((prev) => prev.filter((_, i) => i !== index))}
                            className="hover:bg-red-100 transition-smooth"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right pt-4 border-t border-gray-200">
                      <div className="text-xl font-bold gradient-text">
                        Total: ₹{cartTotal}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>

      {/* Dialogs */}
      <Dialogs
        showAddProductDialog={showAddProductDialog}
        onAddProductOpenChange={setShowAddProductDialog}
        showAIImageDialog={showAIImageDialog}
        onAIImageOpenChange={setShowAIImageDialog}
        showEditImageDialog={showEditImageDialog}
        onEditImageOpenChange={setShowEditImageDialog}
        showCheckoutDialog={showCheckoutDialog}
        onCheckoutOpenChange={setShowCheckoutDialog}
        cartTotal={cartTotal}
        cartItems={cart}
        selectedProduct={selectedProduct}
      />
    </div>
  )
}
