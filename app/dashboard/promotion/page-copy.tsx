import type { Metadata } from "next";
import MainLayout from "@/components/dashboard/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import { 
  TrendingUp, 
  Award, 
  Users, 
  Gift, 
  BadgeIcon as Certificate, 
  Megaphone, 
  Palette, 
  Video,
  Sparkles,
  Calendar,
  QrCode,
  FileText,
  Image,
  CreditCard,
  Globe,
  Clock,
  Star,
  Zap,
  Heart,
  Camera
} from "lucide-react";

export const metadata: Metadata = {
  title: "UniqBrio - Promotion",
  description: "Promotion tools and marketing features for your academy",
}

const comingSoonFeatures = [
  {
    category: "Marketing & Communication",
    color: "purple",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Megaphone className="h-8 w-8" />,
        title: "Smart Broadcast",
        description: "Send targeted messages to students, parents, and staff with intelligent scheduling and personalization.",
        highlights: ["WhatsApp Integration", "Email Campaigns", "SMS Broadcasting", "Auto-scheduling"]
      },
      {
        icon: <TrendingUp className="h-8 w-8" />,
        title: "Campaign Manager",
        description: "Create and manage comprehensive marketing campaigns with analytics and performance tracking.",
        highlights: ["A/B Testing", "ROI Analytics", "Multi-channel", "Automation"]
      },
      {
        icon: <Gift className="h-8 w-8" />,
        title: "Referral System",
        description: "Boost enrollment with a powerful referral program that rewards existing students for bringing in new ones.",
        highlights: ["Reward Tracking", "Referral Analytics", "Custom Incentives", "Social Sharing"]
      }
    ]
  },
  {
    category: "Content Creation & Design",
    color: "orange",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Sparkles className="h-8 w-8" />,
        title: "AI Image Generator",
        description: "Create stunning promotional images and graphics using artificial intelligence.",
        highlights: ["Text-to-Image", "Style Customization", "Bulk Generation", "Brand Consistency"]
      },
      {
        icon: <Palette className="h-8 w-8" />,
        title: "Event Flyer Creator",
        description: "Design professional event flyers and promotional materials with drag-and-drop simplicity.",
        highlights: ["Templates Library", "Custom Branding", "Multi-format Export", "Real-time Preview"]
      },
      {
        icon: <CreditCard className="h-8 w-8" />,
        title: "Visiting Card Designer",
        description: "Create professional business cards for staff and academy representatives.",
        highlights: ["Digital Cards", "QR Integration", "Print Ready", "Contact Sync"]
      }
    ]
  },
  {
    category: "Certificates & Recognition",
    color: "purple",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Certificate className="h-8 w-8" />,
        title: "Certificate Generator",
        description: "Generate beautiful certificates for course completion, achievements, and special recognition.",
        highlights: ["Custom Templates", "Digital Signatures", "Bulk Generation", "Verification System"]
      },
      {
        icon: <Award className="h-8 w-8" />,
        title: "Awards Dashboard",
        description: "Manage student achievements, track progress, and distribute awards and badges.",
        highlights: ["Achievement Tracking", "Badge System", "Leaderboards", "Parent Notifications"]
      }
    ]
  },
  {
    category: "Digital Presence & Tools",
    color: "orange",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Globe className="h-8 w-8" />,
        title: "Academy Web App",
        description: "Create a dedicated web application for your academy with all essential features.",
        highlights: ["Mobile Responsive", "Student Portal", "Parent Dashboard", "Course Catalog"]
      },
      {
        icon: <QrCode className="h-8 w-8" />,
        title: "QR Code Generator",
        description: "Generate QR codes for quick access to academy resources, attendance, and information.",
        highlights: ["Attendance Tracking", "Resource Access", "Contact Info", "Event Check-in"]
      },
      {
        icon: <FileText className="h-8 w-8" />,
        title: "Profile PDF Generator",
        description: "Create comprehensive student and staff profiles in professional PDF format.",
        highlights: ["Academic Records", "Photo Integration", "Custom Layouts", "Batch Processing"]
      }
    ]
  },
  {
    category: "Media & Branding",
    color: "purple",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Video className="h-8 w-8" />,
        title: "Media Management",
        description: "Organize and manage all your academy's media assets including photos, videos, and documents.",
        highlights: ["Cloud Storage", "Asset Tagging", "Bulk Upload", "Access Control"]
      },
      {
        icon: <Palette className="h-8 w-8" />,
        title: "Branding Suite",
        description: "Maintain consistent branding across all academy materials and communications.",
        highlights: ["Brand Guidelines", "Logo Variations", "Color Palettes", "Template Library"]
      }
    ]
  },
  {
    category: "Special Campaigns & Events",
    color: "orange",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Star className="h-8 w-8" />,
        title: "PR Campaign Tools",
        description: "Launch professional PR campaigns to boost academy visibility and reputation.",
        highlights: ["Press Release Templates", "Media Kit", "Social Media Integration", "Analytics"]
      },
      {
        icon: <Calendar className="h-8 w-8" />,
        title: "Custom Calendar",
        description: "Create beautiful calendars with inspirational quotes and academy branding.",
        highlights: ["Monthly Themes", "Custom Quotes", "Event Integration", "Print & Digital"]
      },
      {
        icon: <Heart className="h-8 w-8" />,
        title: "Birthday Card Creator",
        description: "Design personalized birthday cards with celebrity themes and special messages.",
        highlights: ["Celebrity Themes", "Personalization", "Auto-delivery", "Bulk Creation"]
      },
      {
        icon: <Camera className="h-8 w-8" />,
        title: "Art-Focused Calendar",
        description: "Showcase student artwork in a beautiful calendar format for the entire year.",
        highlights: ["Student Artwork", "Monthly Features", "Competition Integration", "Professional Layout"]
      }
    ]
  }
];

export default function PromotionPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-32 right-1/4 text-purple-200 opacity-30">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <div className="absolute top-96 left-1/4 text-orange-200 opacity-30">
          <Star className="h-6 w-6 animate-bounce" />
        </div>
        <div className="absolute bottom-32 right-1/3 text-purple-200 opacity-30">
          <Zap className="h-10 w-10 animate-pulse" />
        </div>
          {/* Hero Section */}
        <div className="container mx-auto py-12 space-y-8">
          <div className="text-center space-y-6 relative">
            {/* Background Hero Image */}
            <div className="absolute inset-0 -z-10 opacity-10">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=600&fit=crop&crop=center" 
                alt="Students in classroom" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            
            <div className="flex justify-center items-center gap-3 mb-4">
              <Sparkles className="h-12 w-12 text-purple-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-orange-500 bg-clip-text text-transparent">
                Promotion Hub
              </h1>
              <Zap className="h-12 w-12 text-orange-500" />
            </div>
            <p className="text-xl text-gray-600 dark:text-white max-w-3xl mx-auto leading-relaxed">
              Revolutionary marketing and promotional tools designed specifically for your academy. 
              
            </p>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-orange-100 text-purple-800 px-6 py-2 text-lg">
              <Clock className="h-4 w-4 mr-2" />
              Coming Soon
            </Badge>
          </div>          {/* Features Grid */}
          <div className="space-y-16 mt-16">
            {comingSoonFeatures.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-8">
                <div className="text-center relative">
                  {/* Category Header with Background Image */}
                  <div className="relative rounded-2xl overflow-hidden mb-8">
                    <div className="absolute inset-0">
                      <img 
                        src={category.image} 
                        alt={category.category}
                        className="w-full h-32 object-cover opacity-20"
                      />
                      <div className={`absolute inset-0 ${
                        category.color === 'purple' 
                          ? 'bg-gradient-to-r from-purple-500/30 to-purple-600/30' 
                          : 'bg-gradient-to-r from-orange-500/30 to-orange-600/30'
                      }`} />
                    </div>
                    <div className="relative py-8">
                      <h2 className={`text-3xl font-bold ${
                        category.color === 'purple' 
                          ? 'text-purple-800' 
                          : 'text-orange-700'
                      } mb-4`}>
                        {category.category}
                      </h2>
                      <div className={`h-1 w-24 mx-auto rounded-full ${
                        category.color === 'purple' 
                          ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
                          : 'bg-gradient-to-r from-orange-400 to-orange-600'
                      }`} />
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card 
                      key={featureIndex} 
                      className={`group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${
                        category.color === 'purple'
                          ? 'border-purple-100 hover:border-purple-300 hover:shadow-purple-100'
                          : 'border-orange-100 hover:border-orange-300 hover:shadow-orange-100'
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-xl ${
                            category.color === 'purple'
                              ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                              : 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'
                          } transition-colors duration-300`}>
                            {feature.icon}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${
                              category.color === 'purple'
                                ? 'border-purple-300 text-purple-700'
                                : 'border-orange-300 text-orange-700'
                            }`}
                          >
                            Coming Soon
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-gray-900 dark:text-white transition-colors">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-gray-600 dark:text-white leading-relaxed">
                          {feature.description}
                        </CardDescription>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-white">Key Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {feature.highlights.map((highlight, highlightIndex) => (
                              <Badge 
                                key={highlightIndex} 
                                variant="secondary" 
                                className={`text-xs ${
                                  category.color === 'purple'
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                }`}
                              >
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="relative text-center py-16 space-y-6 rounded-3xl overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 -z-10">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop&crop=center" 
                alt="Academy success" 
                className="w-full h-full object-cover opacity-15"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-orange-500/20" />
            </div>
            
           
            
          </div>
        </div>
      </div>
    </MainLayout>
  )
}