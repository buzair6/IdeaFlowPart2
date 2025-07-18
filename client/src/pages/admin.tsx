import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiScoreRing } from "@/components/ui/ai-score-ring";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Check, X, Users, Clock, Vote } from "lucide-react";

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: ideas, isLoading: ideasLoading } = useQuery({
    queryKey: ["/api/admin/ideas"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/statistics"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/admin/ideas/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Idea approved",
        description: "The idea has been approved and is now visible to all users.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve idea",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("PUT", `/api/admin/ideas/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Idea rejected",
        description: "The idea has been rejected with feedback.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject idea",
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

  const handleReject = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const reason = prompt("Please provide a reason for rejection:");
    if (reason && reason.trim()) {
      rejectMutation.mutate({ id, reason });
    } else if (reason !== null) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejecting the idea.",
        variant: "destructive"
      });
    }
  };
  
  const handleApprove = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    approveMutation.mutate(id);
  };
  
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


  if (ideasLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
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
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600">Manage and evaluate submitted ideas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <p className="text-sm text-neutral-600">Pending Ideas</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats?.pendingIdeas || 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full"><Clock className="w-5 h-5 text-yellow-600" /></div>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <p className="text-sm text-neutral-600">Approved Ideas</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats?.approvedIdeas || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full"><Check className="w-5 h-5 text-green-600" /></div>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <p className="text-sm text-neutral-600">Total Votes</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats?.totalVotes || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full"><Vote className="w-5 h-5 text-blue-600" /></div>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-6 flex items-center justify-between">
                  <div>
                      <p className="text-sm text-neutral-600">Active Users</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats?.activeUsers || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full"><Users className="w-5 h-5 text-purple-600" /></div>
              </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {ideas?.map((idea: any) => (
            <Collapsible key={idea.id} asChild>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full text-left">
                  <div className="p-6 hover:bg-neutral-100 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-3 mb-2">
                          <h3 className="text-xl font-bold text-neutral-900">{idea.title}</h3>
                          <Badge className={getStatusColor(idea.status)}>
                            {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(idea.category)}>
                            {idea.category.charAt(0).toUpperCase() + idea.category.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Submitted by {idea.author.fullName}
                        </p>
                      </div>
                      {idea.aiScore && (
                        <div className="flex-shrink-0">
                          <AiScoreRing score={idea.aiScore} size="md" />
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-6 pt-0">
                    <div className="py-4">
                      <DescriptionDisplay description={idea.description} />
                    </div>
                    {idea.status === "pending" && (
                      <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="destructive"
                          onClick={(e) => handleReject(e, idea.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={(e) => handleApprove(e, idea.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        {ideas?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">No ideas to review at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}