import { Button } from "@/components/dashboard/ui/button"
import { Plus, Sparkles } from 'lucide-react'
import { useCustomColors } from "@/lib/use-custom-colors"

interface HeroSectionProps {
  onAddProduct: () => void
  onAIImage: () => void
}

export function HeroSection({ onAddProduct, onAIImage }: HeroSectionProps) {
  const { primaryColor, secondaryColor } = useCustomColors()
  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>Sell Products & Services</h1>
        <p className="text-gray-600 dark:text-white">
          Manage inventory, generate AI images, track sales, and let invoices be created automatically for every sale.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={onAddProduct}
          className="text-white transition-smooth glow"
          style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${primaryColor})` }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product/Service
        </Button>
        <Button
          onClick={onAIImage}
          className="text-white transition-smooth glow-orange"
          style={{ backgroundImage: `linear-gradient(to right, ${secondaryColor}, ${secondaryColor})` }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Image Generator
        </Button>
      </div>
    </div>
  )
}
