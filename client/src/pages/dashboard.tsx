import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { IdeaCard } from "@/components/ui/idea-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["/api/ideas"],
  });

  const filteredIdeas = ideas?.filter((idea: any) => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || idea.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    switch (sortBy) {
      case "most-voted":
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case "ai-score":
        return (b.aiScore || 0) - (a.aiScore || 0);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Approved Ideas Dashboard</h1>
            <p className="text-neutral-600">Discover and vote on approved ideas</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Approved Ideas Dashboard</h1>
          <p className="text-neutral-600">Discover and vote on approved ideas</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Input
            placeholder="Search ideas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-64"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Sort by: Latest</SelectItem>
              <SelectItem value="most-voted">Sort by: Most Voted</SelectItem>
              <SelectItem value="ai-score">Sort by: AI Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedIdeas.map((idea: any) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>

        {sortedIdeas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">No ideas found matching your criteria.</p>
          </div>
        )}

        {/* Load More Button */}
        {sortedIdeas.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">Load More Ideas</Button>
          </div>
        )}
      </div>
    </div>
  );
}
