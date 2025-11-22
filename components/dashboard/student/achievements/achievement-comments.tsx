"use client";

import { useState } from "react";
import { Button } from "@/components/dashboard/ui/button";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/ui/avatar";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
import { cn } from "@/lib/dashboard/student/utils";
import { formatDateForDisplay } from "@/lib/dashboard/student/utils";

interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
}

interface AchievementCommentsProps {
  achievementId: string;
  comments: Comment[];
  onAddComment: (achievementId: string, comment: string, replyToId?: string) => void;
  onLike: (achievementId: string) => void;
  onShare: (achievementId: string) => void;
  isLiked?: boolean;
  likesCount: number;
  sharesCount: number;
}

export function AchievementComments({
  achievementId,
  comments,
  onAddComment,
  onLike,
  onShare,
  isLiked,
  likesCount,
  sharesCount,
}: AchievementCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [showShare, setShowShare] = useState(false);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(achievementId, newComment, replyTo || undefined);
      setNewComment("");
      setIsCommenting(false);
      setReplyTo(null);
    }
  };

  const handleReply = (commentId: string) => {
    setIsCommenting(true);
    setReplyTo(commentId);
  };

  const handleShare = async () => {
    // Use Web Share API if available
    const shareData = {
      title: 'Check out this achievement!',
      text: shareMessage || 'Check out this achievement!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowShare(false);
        setShareMessage("");
        onShare(achievementId);
      } catch (err) {
        alert('Share cancelled or failed.');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Share link copied to clipboard!');
        setShowShare(false);
        setShareMessage("");
        onShare(achievementId);
      } catch (err) {
        alert('Could not share or copy link.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(achievementId)}
          className={cn(
            "flex items-center gap-2",
            isLiked && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
          <span>{likesCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCommenting(!isCommenting)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{comments.length}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShare(!showShare)}
          className="flex items-center gap-2"
        >
          <Share2 className="h-5 w-5" />
          <span>{sharesCount}</span>
        </Button>
      </div>

      {isCommenting && (
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {replyTo && (
              <div className="mb-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                Replying to: <b>{comments.find(c => c.id === replyTo)?.authorName}</b><br />
                <span className="italic">"{comments.find(c => c.id === replyTo)?.content}"</span>
              </div>
            )}
            <Textarea
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="mt-2 flex justify-end gap-2">
              {replyTo && (
                <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                  Cancel Reply
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {replyTo ? "Reply" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a message to your share (optional)"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowShare(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleShare}
                disabled={shareMessage.trim().length === 0}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.authorAvatar || "/placeholder-user.jpg"} alt={comment.authorName} />
              <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateForDisplay(typeof comment.timestamp === 'string' ? comment.timestamp : comment.timestamp.toISOString().slice(0,10))}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto px-2 text-xs",
                    comment.isLiked && "text-red-500"
                  )}
                >
                  <Heart
                    className={cn("mr-1 h-3 w-3", comment.isLiked && "fill-current")}
                  />
                  {comment.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 text-xs"
                  onClick={() => handleReply(comment.id)}
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
