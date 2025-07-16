import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiScoreRing } from "@/components/ui/ai-score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, RotateCcw, ArrowUp } from "lucide-react";

export default function MyIdeas() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["/api/my-ideas", activeTab === "all" ? undefined : activeTab],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/ideas/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-ideas"] });
      toast({
        title: "Idea deleted",
        description: "Your idea has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete idea",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-secondary/10 text-secondary";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  const filteredIdeas = ideas?.filter((idea: any) => {
    if (activeTab === "all") return true;
    return idea.status === activeTab;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">My Ideas</h1>
            <p className="text-neutral-600">Track and manage your submitted ideas</p>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">My Ideas</h1>
          <p className="text-neutral-600">Track and manage your submitted ideas</p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 border-b border-neutral-200">
          <nav className="flex space-x-8">
            {[
              { id: "all", label: "All Ideas" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Ideas List */}
        <div className="space-y-4">
          {filteredIdeas.map((idea: any) => (
            <Card key={idea.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">{idea.title}</h3>
                      <Badge className={`text-xs ${getStatusColor(idea.status)}`}>
                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <p className="text-neutral-600 text-sm mb-3">{idea.description}</p>
                    
                    {/* AI Evaluation */}
                    {idea.aiEvaluation && (
                      <div className="mb-3 p-3 bg-primary/5 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">AI</span>
                          </div>
                          <span className="text-sm font-medium text-primary">AI Evaluation</span>
                          <AiScoreRing score={idea.aiScore} size="sm" />
                        </div>
                        <p className="text-sm text-neutral-700">{idea.aiEvaluation}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {idea.status === "rejected" && idea.rejectionReason && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">!</span>
                          </div>
                          <span className="text-sm font-medium text-red-800">Rejection Reason</span>
                        </div>
                        <p className="text-sm text-red-700">{idea.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <span>Submitted {formatTimeAgo(idea.createdAt)}</span>
                      <Badge className={`text-xs ${getCategoryColor(idea.category)}`}>
                        {idea.category.charAt(0).toUpperCase() + idea.category.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {idea.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-500 hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(idea.id)}
                          disabled={deleteMutation.isPending}
                          className="text-neutral-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {idea.status === "approved" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-500 hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {idea.status === "rejected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-500 hover:text-primary"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">No ideas found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
