import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { AiScoreRing } from "./ai-score-ring";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface IdeaCardProps {
  idea: {
    id: number;
    title: string;
    description: string;
    category: string;
    aiScore?: number;
    createdAt: string;
    author: {
      id: number;
      username: string;
      fullName: string;
    };
    upvotes: number;
    downvotes: number;
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async (voteType: "upvote" | "downvote") => {
      const response = await apiRequest("POST", `/api/ideas/${idea.id}/vote`, { voteType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-primary/10 text-primary",
      business: "bg-secondary/10 text-secondary",
      healthcare: "bg-accent/10 text-accent",
      education: "bg-orange-100 text-orange-800",
      environment: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">{idea.title}</h3>
          {idea.aiScore && (
            <div className="flex items-center space-x-2">
              <AiScoreRing score={idea.aiScore} />
            </div>
          )}
        </div>
        
        <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{idea.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <Badge className={`text-xs ${getCategoryColor(idea.category)}`}>
            {idea.category.charAt(0).toUpperCase() + idea.category.slice(1)}
          </Badge>
          <span className="text-xs text-neutral-500">{formatTimeAgo(idea.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => voteMutation.mutate("upvote")}
              disabled={voteMutation.isPending}
              className="flex items-center space-x-1 text-secondary hover:text-secondary/80 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm">{idea.upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => voteMutation.mutate("downvote")}
              disabled={voteMutation.isPending}
              className="flex items-center space-x-1 text-red-500 hover:text-red-400 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              <span className="text-sm">{idea.downvotes}</span>
            </Button>
          </div>
          <div className="text-xs text-neutral-500">By {idea.author.fullName}</div>
        </div>
      </CardContent>
    </Card>
  );
}
