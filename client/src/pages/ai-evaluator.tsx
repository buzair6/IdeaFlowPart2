import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AiScoreRing } from "@/components/ui/ai-score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Bot, Lightbulb, TrendingUp, Target, Database, BarChart3, PieChart, LineChart, FileText, Globe, Users, DollarSign, Clock, CheckCircle } from "lucide-react";

interface AIEvaluation {
  score: number;
  feedback: string;
  feasibility: number;
  marketPotential: number;
  innovation: number;
  impact: number;
  persona: string;
  dataSources: string[];
  recommendedCharts: string[];
  nextSteps: string[];
  marketResearch: string[];
  competitiveAnalysis: string[];
  timeline: string;
  budgetEstimate: string;
}

const categories = [
  "technology",
  "business", 
  "healthcare",
  "education",
  "environment",
  "other"
];

const timelines = [
  "immediate",
  "short",
  "medium", 
  "long"
];

export default function AIEvaluator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [timeline, setTimeline] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai-evaluator/evaluate", {
        title,
        description,
        category,
        timeline,
        targetAudience,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEvaluation(data);
      toast({
        title: "AI Evaluation Complete",
        description: "Your idea has been thoroughly analyzed with personalized recommendations.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to evaluate idea",
        variant: "destructive",
      });
    },
  });

  const handleEvaluate = () => {
    if (!title.trim() || !description.trim() || !category || !timeline || !targetAudience.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to get a comprehensive evaluation.",
        variant: "destructive",
      });
      return;
    }
    evaluateMutation.mutate();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType.toLowerCase()) {
      case "bar chart":
        return <BarChart3 className="h-4 w-4" />;
      case "pie chart":
        return <PieChart className="h-4 w-4" />;
      case "line chart":
        return <LineChart className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">AI Idea Evaluator</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Share Your Idea
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Idea Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your idea title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[120px]"
                  placeholder="Describe your idea in detail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timeline</label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {timelines.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time.charAt(0).toUpperCase() + time.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Who is your target audience?"
                />
              </div>

              <Button 
                onClick={handleEvaluate}
                disabled={evaluateMutation.isPending}
                className="w-full"
              >
                {evaluateMutation.isPending ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Get AI Evaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Evaluation Results */}
          <div className="space-y-6">
            {evaluateMutation.isPending && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {evaluation && (
              <>
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <AiScoreRing score={evaluation.score} size="lg" />
                      <div>
                        <p className="text-sm text-muted-foreground">AI Confidence Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(evaluation.score)}`}>
                          {evaluation.score}/10
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{evaluation.feedback}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Feasibility</p>
                        <p className="text-lg font-bold text-blue-700">{evaluation.feasibility}/10</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Market Potential</p>
                        <p className="text-lg font-bold text-green-700">{evaluation.marketPotential}/10</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-900">Innovation</p>
                        <p className="text-lg font-bold text-purple-700">{evaluation.innovation}/10</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm font-medium text-orange-900">Impact</p>
                        <p className="text-lg font-bold text-orange-700">{evaluation.impact}/10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Persona Feedback */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Expert Persona
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-primary">
                      <p className="text-sm italic">{evaluation.persona}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Sources & Research */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Recommended Data Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {evaluation.dataSources.map((source, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                          <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm">{source}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Charts & Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Recommended Charts & Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {evaluation.recommendedCharts.map((chart, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                          {getChartIcon(chart)}
                          <span className="text-sm font-medium">{chart}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Next Steps & Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {evaluation.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 p-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Market Research */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Market Research Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {evaluation.marketResearch.map((area, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{area}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Timeline Estimate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-900">{evaluation.timeline}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Budget Estimate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-900">{evaluation.budgetEstimate}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}