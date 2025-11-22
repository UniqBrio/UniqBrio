"use client"

import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Users, UserCheck, CreditCard, MessageCircle, Calendar, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface ParentStats {
  totalParents: number;
  activeParents: number;
  paidParents: number;
  communicationRate: number;
  engagementRate: number;
  renewalRate: number;
}

interface ParentStatisticsCardsProps {
  stats?: ParentStats;
}

export default function ParentStatisticsCards({ stats: propStats }: ParentStatisticsCardsProps) {
  const [stats, setStats] = useState<ParentStats>(propStats || {
    totalParents: 0,
    activeParents: 0,
    paidParents: 0,
    communicationRate: 0,
    engagementRate: 0,
    renewalRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // For now, we'll use mock data since there's no parents API endpoint yet
        // Replace this with actual API calls when available
        
        // Calculate stats from static data or API
        const totalParents = 45; // Mock data - replace with real calculation
        const activeParents = Math.round(totalParents * 0.89); // Mock calculation
        const paidParents = Math.round(totalParents * 0.78); // Mock calculation

        const newStats = {
          totalParents,
          activeParents,
          paidParents,
          communicationRate: 94, // Mock data - replace with real calculation
          engagementRate: 87, // Mock data - replace with real calculation  
          renewalRate: 92, // Mock data - replace with real calculation
        };

        console.log('New parent stats:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch parent statistics:', error);
      }
    };

    // Always fetch stats unless props are provided
    if (!propStats) {
      fetchStats();
    }
  }, [propStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Parents</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalParents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Parents</p>
              <p className="text-2xl font-bold text-green-900">{stats.activeParents}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Paid Status</p>
              <p className="text-2xl font-bold text-purple-900">{stats.paidParents}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Communication</p>
              <p className="text-2xl font-bold text-orange-900">{stats.communicationRate}%</p>
            </div>
            <MessageCircle className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Engagement</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.engagementRate}%</p>
            </div>
            <Calendar className="h-8 w-8 text-emerald-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Renewal Rate</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.renewalRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}