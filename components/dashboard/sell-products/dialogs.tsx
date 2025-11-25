import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Textarea } from "@/components/dashboard/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { Upload, Sparkles, RefreshCw, Save, Wand2, X, CheckCircle, Smartphone, Wallet, Building2, CreditCard, Receipt, Building, Banknote, Edit } from 'lucide-react'

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

interface DialogsProps {
  showAddProductDialog: boolean
  onAddProductOpenChange: (open: boolean) => void
  showAIImageDialog: boolean
  onAIImageOpenChange: (open: boolean) => void
  showEditImageDialog: boolean
  onEditImageOpenChange: (open: boolean) => void
  showCheckoutDialog: boolean
  onCheckoutOpenChange: (open: boolean) => void
  cartTotal: number
  cartItems: any[]
  selectedProduct?: Product | null
}

export function Dialogs({
  showAddProductDialog,
  onAddProductOpenChange,
  showAIImageDialog,
  onAIImageOpenChange,
  showEditImageDialog,
  onEditImageOpenChange,
  showCheckoutDialog,
  onCheckoutOpenChange,
  cartTotal,
  cartItems,
  selectedProduct,
}: DialogsProps) {
  const [aiImageStyle, setAiImageStyle] = useState("Realistic")
  const [generatedImage, setGeneratedImage] = useState("")
  const [aiImagePrompt, setAiImagePrompt] = useState("")
  const [editImagePrompt, setEditImagePrompt] = useState("")
  const [uploadedImage1, setUploadedImage1] = useState<string | null>(null)
  const [uploadedImage2, setUploadedImage2] = useState<string | null>(null)
  
  // Local state for form fields (not stored anywhere)
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formStock, setFormStock] = useState("")

  const generateAIImage = () => {
    setGeneratedImage(
      `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(aiImagePrompt + " " + aiImageStyle)}`,
    )
  }

  return (
    <>
      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={onAddProductOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'View Product/Service' : 'Add New Product/Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Product/Service Name</label>
                <Input 
                  placeholder="Enter name" 
                  value={selectedProduct ? selectedProduct.name : formName}
                  onChange={(e) => !selectedProduct && setFormName(e.target.value)}
                  readOnly={!!selectedProduct}
                  className="mt-1" 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={selectedProduct ? selectedProduct.category : formCategory} 
                  onValueChange={(value) => !selectedProduct && setFormCategory(value)}
                  disabled={!!selectedProduct}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Art Materials">Art Materials</SelectItem>
                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Courses">Courses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter description"
                value={selectedProduct ? selectedProduct.description : formDescription}
                onChange={(e) => !selectedProduct && setFormDescription(e.target.value)}
                readOnly={!!selectedProduct}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price (?)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={selectedProduct ? selectedProduct.price : formPrice}
                  onChange={(e) => !selectedProduct && setFormPrice(e.target.value)}
                  readOnly={!!selectedProduct}
                  className="mt-1" 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock Quantity</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={selectedProduct ? selectedProduct.stock : formStock}
                  onChange={(e) => !selectedProduct && setFormStock(e.target.value)}
                  readOnly={!!selectedProduct}
                  className="mt-1" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Product Image</label>
              <div className="flex items-center space-x-4 mt-2">
                <Button
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEditImageOpenChange(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAIImageOpenChange(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Image
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => onAddProductOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Image Generator Dialog */}
      <Dialog open={showAIImageDialog} onOpenChange={onAIImageOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Image Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Product Name</label>
              <Input
                placeholder="Enter product name"
                value={aiImagePrompt}
                onChange={(e) => setAiImagePrompt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Short Description</label>
              <Textarea
                placeholder="Describe the product for AI generation"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Style Preference</label>
              <Select value={aiImageStyle} onValueChange={setAiImageStyle}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Realistic", "Cartoon", "Minimalist", "Abstract", "Professional"].map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateAIImage}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate AI Image
            </Button>
            {generatedImage && (
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={generatedImage || "/placeholder.svg"}
                    alt="Generated product image"
                    className="max-w-full h-64 object-cover rounded-xl mx-auto border border-gray-200"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save to Product
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Image Dialog */}
      <Dialog open={showEditImageDialog} onOpenChange={onEditImageOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Upload Image 1</label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  {uploadedImage1 ? (
                    <div className="relative">
                      <img src={uploadedImage1} alt="Upload 1" className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImage1(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-white" />
                      <div className="text-sm text-gray-600 dark:text-white">Click to upload or drag and drop</div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload1"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => setUploadedImage1(event.target?.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('upload1')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Upload Image 2</label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  {uploadedImage2 ? (
                    <div className="relative">
                      <img src={uploadedImage2} alt="Upload 2" className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImage2(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-white" />
                      <div className="text-sm text-gray-600 dark:text-white">Click to upload or drag and drop</div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="upload2"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => setUploadedImage2(event.target?.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('upload2')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Editing Prompt</label>
              <Input
                placeholder="Enter editing instructions (e.g., 'Remove background', 'Adjust brightness')..."
                value={editImagePrompt}
                onChange={(e) => setEditImagePrompt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => onEditImageOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Wand2 className="h-4 w-4 mr-2" />
                Apply Edit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={onCheckoutOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Checkout & Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input placeholder="Enter customer name" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="customer@example.com" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input placeholder="+91 9876543210" className="mt-1" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>?{item.product.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{cartTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>?{(cartTotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold gradient-text text-lg">
                    <span>Total:</span>
                    <span>?{(cartTotal * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Apply Coupon</label>
              <div className="flex space-x-2">
                <Input placeholder="Enter coupon code" />
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Apply</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "UPI", icon: Smartphone },
                  { label: "Wallets", icon: Wallet },
                  { label: "Net Banking", icon: Building2 },
                  { label: "Card", icon: CreditCard },
                  { label: "Cheque", icon: Receipt },
                  { label: "Bank Transfer", icon: Building },
                  { label: "Cash", icon: Banknote },
                ].map((method, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <method.icon className="h-6 w-6 mb-1" />
                    <span className="text-xs text-center">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => onCheckoutOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
