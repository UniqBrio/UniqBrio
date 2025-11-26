import { useCustomColors } from "@/lib/use-custom-colors"

export function Footer() {
  const { primaryColor, secondaryColor } = useCustomColors()
  return (
    <footer className="bg-white/90 border-t border-gray-200 px-6 py-8 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="/legal/privacy"
                className="block text-gray-600 dark:text-white transition-smooth"
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = primaryColor }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "" }}
              >
                How We Protect Your Academy
              </a>
              <a
                href="/legal/terms"
                className="block text-gray-600 dark:text-white transition-smooth"
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = primaryColor }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "" }}
              >
                Our Promise to You
              </a>
              <a
                href="/legal/cookies"
                className="block text-gray-600 dark:text-white transition-smooth"
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = primaryColor }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "" }}
              >
                Cookie Policy
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Social Media</h3>
            <div className="flex space-x-4">
              {["LinkedIn", "Instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-600 dark:text-white transition-smooth"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = primaryColor }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "" }}
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-white">Powered by</span>
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center glow"
                  style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                >
                  <span className="text-white font-bold text-xs">XYZ</span>
                </div>
                <span className="font-semibold gradient-text">UniqBrio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
