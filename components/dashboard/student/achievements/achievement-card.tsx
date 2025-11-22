"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/dashboard/ui/card";
import { Achievement } from "@/types/dashboard/achievement";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import { Heart, Share2, Trophy } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { AchievementComments } from "./achievement-comments";
import { cn } from "@/lib/dashboard/student/utils";

interface AchievementCardProps {
  achievement: Achievement;
  onLike: (id: string) => void;
  onCongratulate: (id: string) => void;
  onShare: (id: string) => void;
}

export function AchievementCard({
  achievement,
  onLike,
  onCongratulate,
  onShare,
}: AchievementCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([
    {
      id: "1",
      authorName: "Teacher",
      content: "Outstanding achievement! Keep up the great work.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      likes: 5,
      isLiked: false,
    },
    {
      id: "2",
      authorName: "Parent",
      content: "We are so proud of you! This is amazing.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      likes: 3,
      isLiked: false,
    },
  ]);

  const handleLike = (id: string) => {
    setIsLiked(!isLiked);
    onLike(id);
  };

  const handleAddComment = (id: string, content: string) => {
    const newComment = {
      id: Date.now().toString(),
      authorName: "You",
      content,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
    };
    setComments([...comments, newComment]);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{achievement.title}</h3>
          <Badge variant={achievement.type === "individual" ? "default" : "secondary"}>
            {achievement.type}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(achievement.createdAt, { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievement.photoUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={achievement.photoUrl}
              alt={achievement.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <AchievementComments
          achievementId={achievement.id}
          comments={comments}
          onAddComment={handleAddComment}
          onLike={handleLike}
          onShare={onShare}
          isLiked={isLiked}
          likesCount={achievement.likes + (isLiked ? 1 : 0)}
          sharesCount={achievement.shares}
        />
      </CardFooter>
    </Card>
  );
}
