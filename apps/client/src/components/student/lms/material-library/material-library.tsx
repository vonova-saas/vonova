"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ImageIcon, Presentation, Library, HelpCircle, Sparkles, RefreshCcw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLibraryItemsQueryFn } from "@/services/api/shared/material-library/material.api";
import type { Material } from "@/types/api/shared/material-library/material.type";

// Helper function to get material icon
function getMaterialIcon(type: string) {
  const iconClass = "w-10 h-10 text-primary transition-all duration-300 group-hover:scale-110";
  switch (type) {
    case 'book':
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
          <Book className={`${iconClass} relative`} />
        </div>
      );
    case 'visual-guide':
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg blur-sm"></div>
          <ImageIcon className={`${iconClass} relative`} />
        </div>
      );
    case 'presentation':
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg blur-sm"></div>
          <Presentation className={`${iconClass} relative`} />
        </div>
      );
    default:
      // Fallback to Library icon for any unknown types
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-lg blur-sm"></div>
          <Library className={`${iconClass} relative`} />
        </div>
      );
  }
}

export default function MaterialLibrary() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch published materials from API
  const { data: materialsData, isLoading, error, refetch } = useQuery({
    queryKey: ['student-library'],
    queryFn: () => fetchLibraryItemsQueryFn(undefined, 'PUBLISHED'),
  });

  const materials = materialsData?.items || [];
  const loading = isLoading;

  // Filter materials based on search query
  const filteredMaterials = materials.filter((material: any) =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Real stats from materials
  const totalMaterials = materials.length;
  const totalTopics = new Set(materials.map((m: any) => m.topicId).filter(Boolean)).size;

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Student hub
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Material Library</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Access books, guides, and presentations to boost your computer science journey.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          {loading ? (
            // Skeleton Loaders for Student Statistics Cards (2 columns)
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 text-center md:gap-6">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5 overflow-hidden">
                  <div className="relative">
                    <div className="w-16 h-8 bg-muted rounded-lg animate-pulse mx-auto mb-2"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-muted animate-pulse"></div>
                  </div>
                  <div className="relative">
                    <div className="w-20 h-4 bg-muted rounded-lg animate-pulse mx-auto"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-muted animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 text-center md:gap-6">
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalMaterials}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  Materials
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalTopics}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  Topics
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 flex flex-col items-center">
      {/* Search Bar */}
      <div className="w-full max-w-5xl mb-6">
        <div className="relative">
          <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search materials by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {loading ? (
          // Skeleton Loaders with shimmer effect
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-full flex flex-col justify-between shadow-md border overflow-hidden">
              <CardHeader className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-muted animate-pulse" />
                </div>
                <div className="w-3/4 h-6 bg-muted rounded-lg animate-pulse" />
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 flex-1">
                <div className="w-full h-4 bg-muted rounded-lg animate-pulse" />
                <div className="w-full h-4 bg-muted rounded-lg animate-pulse" />
                <div className="w-2/3 h-4 bg-muted rounded-lg animate-pulse" />
                <div className="w-full h-10 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : filteredMaterials.length > 0 ? (
          // Materials List with enhanced hover effects
          filteredMaterials.map((material: any) => (
            <Card key={material._id} className="h-full flex flex-col justify-between shadow-md border hover:shadow-2xl hover:-translate-y-1 group relative transition-all duration-300 ease-out">
              {/* Material Type Badge */}
              <span className="absolute top-4 right-4 z-10 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow">
                {material.type}
              </span>
              
              <CardHeader className="flex flex-col items-center gap-2">
                {getMaterialIcon(material.type)}
                <CardTitle className="text-xl text-center line-clamp-2">
                  {material.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 flex-1">
                <p className="text-center text-muted-foreground mb-4 line-clamp-3">
                  {material.description || 'No description available'}
                </p>
                
                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Book className="w-3 h-3" />
                    {material.viewCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {material.downloadCount || 0}
                  </span>
                </div>
                
                {/* Action Button */}
                <Button 
                  className="w-full"
                  disabled={!material.fileUrl}
                  onClick={() => material.fileUrl && window.open(material.fileUrl, '_blank')}
                >
                  {material.fileUrl ? 'View Material' : 'Not Available'}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty State
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="bg-muted/10 rounded-full p-6 mb-4">
              <FileText className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No materials available yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Materials will appear here once instructors add them to the library.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()} disabled={loading}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
