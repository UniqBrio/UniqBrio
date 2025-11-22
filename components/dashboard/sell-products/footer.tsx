export function Footer() {
  return (
    <footer className="bg-white/90 border-t border-gray-200 px-6 py-8 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Contact Us"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-gray-600 hover:text-orange-500 transition-smooth"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Social Media</h3>
            <div className="flex space-x-4">
              {["LinkedIn", "Instagram"].map((social) => (
                <a key={social} href="#" className="text-gray-600 hover:text-orange-500 transition-smooth">
                  {social}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Powered by</span>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-orange-500 rounded flex items-center justify-center glow">
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
