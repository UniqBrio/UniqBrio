"use client"

export const dynamic = 'force-dynamic'

;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import {
  Users,
  Award,
  Filter,
  Image,
  Calendar,
  MessageSquare,
  TrendingUp,
  FileText,
  Sparkles,
  Heart,
  Star,
  Clock,
  Zap,
  Trophy,
  Briefcase,
  DollarSign,
  Handshake,
  BarChart3,
  Send,
} from "lucide-react";

// Note: metadata export removed - not compatible with "use client"

const alumniFeatures = [
  {
    category: "Alumni Profiles & Information",
    color: "purple",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Users className="h-8 w-8" />,
        title: "Alumni Directory",
        description: "Maintain a searchable database of all past students, with their sports background and batch information.",
        highlights: ["Searchable Database", "Sports Background", "Batch Information", "Contact Details"]
      },
      {
        icon: <Trophy className="h-8 w-8" />,
        title: "Achievements & Career Highlights",
        description: "Showcase alumni accomplishments, professional milestones, and sports achievements post-academy.",
        highlights: ["Career Milestones", "Sports Achievements", "Professional Growth", "Success Stories"]
      },
      {
        icon: <Filter className="h-8 w-8" />,
        title: "Batch & Sport-wise Grouping",
        description: "Organize alumni based on their sport category, training batch, or graduation year.",
        highlights: ["Sport Categorization", "Batch Grouping", "Year Filter", "Quick Access"]
      }
    ]
  },
  {
    category: "Events & Community",
    color: "orange",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Image className="h-8 w-8" />,
        title: "Alumni Gallery & Highlights",
        description: "Display photos and highlights from alumni events, reunions, and tournaments.",
        highlights: ["Photo Gallery", "Event Highlights", "Reunion Photos", "Tournament Records"]
      },
      {
        icon: <Calendar className="h-8 w-8" />,
        title: "Alumni Events & Reunions",
        description: "Plan and manage alumni gatherings, sports meets, and mentorship sessions.",
        highlights: ["Event Planning", "RSVP System", "Sports Meets", "Mentorship Sessions"]
      },
      {
        icon: <Handshake className="h-8 w-8" />,
        title: "Alumni Networking Portal",
        description: "Create a community platform for alumni to connect, mentor current students, and share opportunities.",
        highlights: ["Community Platform", "Mentorship", "Job Opportunities", "Networking Hub"]
      }
    ]
  },
  {
    category: "Financial & Engagement",
    color: "purple",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <DollarSign className="h-8 w-8" />,
        title: "Donations & Sponsorship Tracking",
        description: "Record and manage alumni contributions, sponsorships, and donations to the academy.",
        highlights: ["Donation Tracking", "Sponsorship Records", "Contribution History", "Tax Reports"]
      },
      {
        icon: <FileText className="h-8 w-8" />,
        title: "Certificates & ID Management",
        description: "Issue digital alumni certificates, manage alumni IDs, and verify past records.",
        highlights: ["Digital Certificates", "Alumni ID System", "Record Verification", "Archive Access"]
      }
    ]
  },
  {
    category: "Analytics & Communication",
    color: "orange",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <BarChart3 className="h-8 w-8" />,
        title: "Alumni Engagement Analytics",
        description: "Monitor alumni activity trends, participation in events, and engagement scores.",
        highlights: ["Activity Trends", "Participation Metrics", "Engagement Scores", "Performance Reports"]
      },
      {
        icon: <Send className="h-8 w-8" />,
        title: "Communication & Outreach Center",
        description: "Send newsletters, announcements, and event invitations directly to alumni.",
        highlights: ["Newsletter Distribution", "Event Invitations", "Announcements", "Bulk Messaging"]
      },
      {
        icon: <Briefcase className="h-8 w-8" />,
        title: "Mentorship & Volunteering Programs",
        description: "Enable alumni to mentor current athletes and participate in academy initiatives.",
        highlights: ["Mentorship Programs", "Volunteer Tracking", "Program Management", "Impact Metrics"]
      }
    ]
  },
  {
    category: "Search & Discovery",
    color: "purple",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop&crop=center",
    features: [
      {
        icon: <Award className="h-8 w-8" />,
        title: "Advanced Filters & Search Tools",
        description: "Search and filter alumni by name, sport, year, batch, location, or achievements.",
        highlights: ["Multi-filter Search", "Name Search", "Location Filter", "Achievement Filter"]
      }
    ]
  }
];

export default function AlumniPage() {
  return (
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
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop&crop=center" 
                alt="Alumni management" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            
            <div className="flex justify-center items-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-purple-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-orange-500 bg-clip-text text-transparent">
                Alumni Management System
              </h1>
              <Users className="h-12 w-12 text-orange-600" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive alumni management tools designed to maintain connections, track achievements, and foster a thriving alumni community.
            </p>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-orange-100 text-purple-800 px-6 py-2 text-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Alumni Network Features
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="space-y-16 mt-16">
            {alumniFeatures.map((category, categoryIndex) => (
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
                        <CardTitle className="text-xl font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {feature.description}
                        </CardDescription>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Key Features:</p>
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
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop&crop=center" 
                alt="Alumni community" 
                className="w-full h-full object-cover opacity-15"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-orange-500/20" />
            </div>
            
            <div className="relative space-y-4">
              <h3 className="text-3xl font-bold text-gray-800">
                Build a Thriving Alumni Community
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect with past champions, celebrate achievements, facilitate mentorship, and strengthen your academy's legacy through alumni engagement.
              </p>
            </div>
          </div>
        </div>
      </div>);
}
