import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send } from "lucide-react";

const questions = [
  {
    id: "idea_summary",
    label: "1. What is your idea?",
    placeholder: "Describe your business idea in one simple sentence.",
  },
  {
    id: "idea_importance",
    label: "2. Why is this idea important now, and how will it work?",
    placeholder: "What problem are you addressing? What's the basic plan? What makes this the right time?",
  },
  {
    id: "idea_strengths",
    label: "3. Which strengths and capabilities make your team best-placed to execute this idea?",
    placeholder: "Why is your team best placed to take this forward? Do you have the right skills, knowledge, or relationships?",
  },
  {
    id: "idea_impact",
    label: "4. What will the impact be?",
    placeholder: "What are the potential financial and non-financial benefits? How much investment (CAPEX) will this require?",
  },
  {
    id: "idea_practicality",
    label: "5. Is the idea practical and ready to move forward?",
    placeholder: "Is this realistic with current resources? What feasibility work have you done? If tried before, what did you learn?",
  },
];

export default function SubmitIdea() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [answers, setAnswers] = useState(Array(5).fill(""));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ideas", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Idea submitted!",
        description: "Your idea has been sent for admin approval.",
      });
      setLocation("/my-ideas");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit idea. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      toast({
        title: "Category is required",
        description: "Please select a category for your idea.",
        variant: "destructive",
      });
      return;
    }

    const description = questions
      .map((q, index) => `### ${q.label}\n\n${answers[index]}`)
      .join('\n\n---\n\n');

    const submissionData = {
      title,
      category,
      description,
    };
    
    submitMutation.mutate(submissionData);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Submit Your Idea</h1>
          <p className="text-neutral-600">Share your innovative idea with the community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Idea Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Idea Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your idea"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>{q.label}</Label>
                  <Textarea
                    id={q.id}
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={q.placeholder}
                    rows={4}
                    required
                  />
                </div>
              ))}

              <div className="flex justify-end items-center">
                <Button type="submit" disabled={submitMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}