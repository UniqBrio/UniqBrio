import { Button } from "@/components/dashboard/ui/button"
import { Plus, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  onAddProduct: () => void
  onAIImage: () => void
}

export function HeroSection({ onAddProduct, onAIImage }: HeroSectionProps) {
  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-700 mb-2">Sell Products & Services</h1>
        <p className="text-gray-600 dark:text-white">
          Manage inventory, generate AI images, track sales, and let invoices be created automatically for every sale.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={onAddProduct}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-smooth glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product/Service
        </Button>
        <Button
          onClick={onAIImage}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-smooth glow-orange"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Image Generator
        </Button>
      </div>
    </div>
  )
}
