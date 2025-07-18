import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { AiScoreRing } from "./ai-score-ring";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  
  const parts = idea.description.split('\n\n---\n\n');
  const firstPart = parts[0] || '';
  const restOfParts = parts.slice(1);
  
  const firstAnswer = firstPart.split('\n\n').slice(1).join('\n\n').trim();

  const detailedDescription = restOfParts.map((part, index) => {
      const lines = part.split('\n\n');
      const question = lines[0] || '';
      const answer = lines.slice(1).join('\n\n').trim();
      return { id: index, question, answer };
  });

  return (
    <Collapsible asChild>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CollapsibleTrigger className="w-full text-left">
          <div className="p-6 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2">{idea.title}</h3>
              {idea.aiScore && (
                <div className="flex items-center space-x-2">
                  <AiScoreRing score={idea.aiScore} />
                </div>
              )}
            </div>
            
            <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{firstAnswer}</p>
            
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
                  onClick={(e) => { e.stopPropagation(); voteMutation.mutate("upvote"); }}
                  disabled={voteMutation.isPending}
                  className="flex items-center space-x-1 text-secondary hover:text-secondary/80 transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm">{idea.upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); voteMutation.mutate("downvote"); }}
                  disabled={voteMutation.isPending}
                  className="flex items-center space-x-1 text-red-500 hover:text-red-400 transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm">{idea.downvotes}</span>
                </Button>
              </div>
              <div className="text-xs text-neutral-500">By {idea.author.fullName}</div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
            <div className="px-6 pb-6 pt-4 border-t border-neutral-200">
                {detailedDescription.map(item => (
                    <div key={item.id} className="mt-4">
                        <h4 className="font-semibold text-sm text-neutral-800">{item.question.replace(/###\s\d\.\s/g, '')}</h4>
                        <p className="text-neutral-600 text-sm mt-1 whitespace-pre-wrap">{item.answer}</p>
                    </div>
                ))}
            </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}