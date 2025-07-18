import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, RotateCcw, AlertCircle } from "lucide-react";

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
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-blue-100 text-blue-800 border-blue-200",
      business: "bg-indigo-100 text-indigo-800 border-indigo-200",
      healthcare: "bg-purple-100 text-purple-800 border-purple-200",
      education: "bg-orange-100 text-orange-800 border-orange-200",
      environment: "bg-green-100 text-green-800 border-green-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
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
  
  const DescriptionDisplay = ({ description }: { description: string }) => {
    const parts = description.split('\n\n---\n\n').map(part => {
      const lines = part.split('\n\n');
      const question = lines[0].replace(/###\s\d\.\s/g, '').trim();
      const answer = lines.slice(1).join('\n\n');
      return { question, answer };
    });
  
    return (
      <div className="prose prose-sm max-w-none text-neutral-600 prose-headings:font-semibold prose-headings:text-neutral-800 prose-p:my-1">
        {parts.map((part, index) => (
          <div key={index} className="not-first:mt-4">
            <h4>{part.question}</h4>
            <p>{part.answer}</p>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">My Ideas</h1>
            <p className="text-neutral-600">Track and manage your submitted ideas</p>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">My Ideas</h1>
          <p className="text-neutral-600">Track and manage your submitted ideas</p>
        </div>

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

        <div className="space-y-6">
          {filteredIdeas.map((idea: any) => (
            <Card key={idea.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-neutral-900">{idea.title}</h3>
                      <Badge className={getStatusColor(idea.status)}>
                        {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                      </Badge>
                    </div>
                     <DescriptionDisplay description={idea.description} />
                  </div>
                  <div className="flex items-center space-x-2">
                    {idea.status === 'pending' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-500" onClick={() => deleteMutation.mutate(idea.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                    )}
                    {idea.status === 'approved' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                    )}
                    {idea.status === 'rejected' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-primary"><RotateCcw className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>

                {idea.status === "rejected" && idea.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 text-red-900 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Rejection Reason</h4>
                      <p className="text-sm text-red-800">{idea.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex items-center justify-between">
                 <span className="text-xs text-neutral-500">Submitted {formatTimeAgo(idea.createdAt)}</span>
                 <Badge variant="outline" className={getCategoryColor(idea.category)}>
                   {idea.category.charAt(0).toUpperCase() + idea.category.slice(1)}
                 </Badge>
              </div>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">No ideas found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}