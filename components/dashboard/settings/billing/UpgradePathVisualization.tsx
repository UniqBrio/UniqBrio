"use client"
import React, { useState } from "react"
import { TrendingUp, Users, Award, Zap, Crown, CheckCircle, ArrowRight, Sparkles } from "lucide-react"

interface Milestone {
  id: string
  title: string
  description: string
  completed: boolean
  current?: boolean
  icon: React.ReactNode
  benefit: string
}

export function UpgradePathVisualization() {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null)

  const milestones: Milestone[] = [
    {
      id: "start",
      title: "Started with Free",
      description: "Joined UniqBrio platform",
      completed: true,
      icon: <TrendingUp size={20} className="text-blue-600" />,
      benefit: "7 students limit"
    },
    {
      id: "grow",
      title: "Upgraded to Grow",
      description: "Unlocked unlimited students",
      completed: true,
      current: true,
      icon: <Zap size={20} className="text-purple-600" />,
      benefit: "Unlimited students + automation"
    },
    {
      id: "milestone-100",
      title: "Next: 100 Students",
      description: "Add 20 more students to optimize costs",
      completed: false,
      icon: <Users size={20} className="text-orange-600" />,
      benefit: "Better ROI per student"
    },
    {
      id: "scale",
      title: "Ready for Scale",
      description: "Unlock premium features",
      completed: false,
      icon: <Crown size={20} className="text-yellow-600" />,
      benefit: "Payroll + White-label + Dedicated manager"
    },
    {
      id: "enterprise",
      title: "Enterprise Level",
      description: "Multi-branch operations",
      completed: false,
      icon: <Award size={20} className="text-emerald-600" />,
      benefit: "Custom integrations + Priority support"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-purple-600" size={24} />
          Your Growth Journey
        </h2>
        <p className="text-sm text-gray-600">Track your progress and plan your next milestone</p>
      </div>

      {/* Journey Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200">
          <div 
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-purple-600 to-orange-500 transition-all duration-1000"
            style={{ height: '40%' }}
          />
        </div>

        {/* Milestones */}
        <div className="space-y-8 relative">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`relative flex items-start gap-4 pl-20 pr-6 py-4 rounded-xl transition-all duration-300 ${
                hoveredMilestone === milestone.id ? 'bg-purple-50 scale-105' : ''
              } ${milestone.current ? 'bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-purple-300' : ''}`}
              onMouseEnter={() => setHoveredMilestone(milestone.id)}
              onMouseLeave={() => setHoveredMilestone(null)}
            >
              {/* Icon Node */}
              <div 
                className={`absolute left-4 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  milestone.completed 
                    ? 'bg-gradient-to-br from-purple-600 to-orange-500 border-white shadow-lg' 
                    : milestone.current
                    ? 'bg-white border-purple-500 shadow-md animate-pulse'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                {milestone.completed ? (
                  <CheckCircle className="text-white" size={24} />
                ) : (
                  milestone.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-bold text-lg ${milestone.current ? 'text-purple-700' : 'text-gray-900'}`}>
                      {milestone.title}
                      {milestone.current && (
                        <span className="ml-2 text-xs font-semibold text-white bg-purple-600 px-2 py-1 rounded-full">
                          Current Plan
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  </div>
                  {milestone.completed && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                      Completed
                    </span>
                  )}
                </div>

                {/* Benefit Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  milestone.completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : milestone.current
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Sparkles size={14} />
                  {milestone.benefit}
                </div>

                {/* CTA for next milestone */}
                {!milestone.completed && index === milestones.findIndex(m => !m.completed) && (
                  <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-sm group">
                    {milestone.id === 'scale' ? 'Upgrade Now' : 'View Recommendations'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-purple-700 mb-1">2/5</div>
          <p className="text-sm font-medium text-gray-700">Milestones Completed</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-orange-700 mb-1">8 months</div>
          <p className="text-sm font-medium text-gray-700">With UniqBrio</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-emerald-700 mb-1">↗️ 45%</div>
          <p className="text-sm font-medium text-gray-700">Growth Rate</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-dashed border-purple-300 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap className="text-purple-600" size={20} />
          Personalized Recommendations
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            <span>You're close to 100 students! Consider Scale plan when you reach this milestone for better value.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            <span>Your growth rate is excellent. With current pace, you'll need advanced features in 3 months.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600">•</span>
            <span>Enable all Grow features to maximize your student retention and satisfaction.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
