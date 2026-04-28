"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ImageIcon, Presentation, Library, HelpCircle, Sparkles, RefreshCcw, Plus, Edit, Trash2, Upload, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchLibraryItemsQueryFn, 
  createLibraryBookMutationFn,
  completeUploadMutationFn,
  deleteMaterialMutationFn
} from "@/services/api/shared/material-library/material.api";
import type { 
  CreateMaterialRequest,
  MaterialsListResponse 
} from "@/types/api/shared/material-library/material.type";
import { toast } from "@/hooks/app/use-toast";

// Local Material interface matching Unified LMS API backend response
interface Material {
  _id: string;
  title: string;
  description?: string;
  summary?: string;
  type: 'book' | 'video' | 'document' | 'presentation' | 'audio' | 'visual-guide';
  topics: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  status?: 'PUBLISHED' | 'DRAFT';
  downloadCount?: number;
  viewCount?: number;
  fileAssetId?: {
    urls: {
      streamUrl?: string;
    };
  };
}

// Local stats interface for frontend calculation
interface LocalStats {
  totalMaterials: number;
  totalTopics: number;
  totalDownloads: number;
}

// Static topics array for dropdown (global scope)
const staticTopics = [
  { value: 'programming-basics', label: 'Programming Basics' },
  { value: 'web-development', label: 'Web Development' },
  { value: 'data-science', label: 'Data Science' }
];

export default function MaterialLibraryManagementPage() {
  const handleViewMaterial = (material: Material) => {
    // Check if fileAssetId exists and has streamUrl
    if (material.fileAssetId?.urls?.streamUrl) {
      const url = material.fileAssetId.urls.streamUrl;
      // Check if it's a PDF and handle accordingly
      if (url.toLowerCase().includes('.pdf')) {
        // For PDFs, open in new tab safely
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        // For other files, open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else if (material.fileAssetId) {
      // fileAssetId exists but no streamUrl
      toast({
        title: "Processing File",
        description: "File is being processed. Please try again later.",
        variant: "destructive",
      });
    } else if (material.fileUrl) {
      // Fallback to fileUrl if available
      const url = material.fileUrl;
      if (url.toLowerCase().includes('.pdf')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // No file asset at all
      toast({
        title: "No File Available",
        description: "No file has been uploaded for this material yet.",
        variant: "destructive",
      });
    }
  };

  // Static Mock Data for Demo
  const staticMaterials: Material[] = [
    {
      _id: "1",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      title: "Introduction to Programming",
      description: "A comprehensive guide to programming fundamentals",
      type: "book",
      status: "PUBLISHED",
      topics: ["programming-basics"],
      author: "Demo Author",
      createdAt: "2024-04-20T10:00:00Z",
      updatedAt: "2024-04-20T10:00:00Z",
      fileAssetId: {
        urls: {
          streamUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        }
      }
    },
    {
      _id: "2", 
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      title: "Web Development Guide",
      description: "Complete guide to modern web development",
      type: "visual-guide",
      status: "PUBLISHED",
      topics: ["web-development"],
      author: "Demo Author",
      createdAt: "2024-04-21T14:30:00Z",
      updatedAt: "2024-04-21T14:30:00Z",
      fileAssetId: {
        urls: {
          streamUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        }
      }
    },
    {
      _id: "3",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      title: "React Presentation",
      description: "Introduction to React framework",
      type: "presentation",
      status: "PUBLISHED",
      topics: ["web-development"],
      author: "Demo Author",
      createdAt: "2024-04-22T09:15:00Z",
      updatedAt: "2024-04-22T09:15:00Z",
      fileAssetId: {
        urls: {
          streamUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        }
      }
    }
  ];

  const queryClient = useQueryClient();
  const [materials, setMaterials] = useState<Material[]>(staticMaterials);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /*
  // Load materials on mount - COMMENTED OUT FOR DEMO
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // Use Unified LMS Library API to fetch materials
      const response = await fetchLibraryItemsQueryFn();
      setMaterials(response.items || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
      setMaterials([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };
  */

  // Calculate frontend stats from materials state
  const calculatedStats: LocalStats = {
    totalMaterials: materials.length,
    totalTopics: new Set(materials.flatMap(m => m.topics)).size,
    totalDownloads: materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0)
  };

  // Filter materials based on search query
  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMaterial = async (data: CreateMaterialRequest) => {
    try {
      // Use Unified LMS Library API with proper field mapping
      await createLibraryBookMutationFn(data);
      
      // Create new Material object with required properties
      const newMaterial: Material = {
        _id: Date.now().toString(),
        title: data.title,
        description: data.description,
        type: data.type || 'book',
        topics: data.topicId ? [data.topicId] : [],
        fileUrl: data.fileUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'DRAFT'
      };
      
      setMaterials(prev => [...prev, newMaterial]);
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      setIsAddModalOpen(false);
      toast({
        title: "Material Added",
        description: "Material has been added successfully.",
      });
    } catch (error) {
      console.error('Failed to add material:', error);
      toast({
        title: "Error",
        description: "Failed to add material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMaterial = async (id: string, data: Partial<CreateMaterialRequest>) => {
    try {
      // For now, just reload materials since update functionality is not implemented in the new API
      await loadMaterials();
      setEditingMaterial(null);
      
      // Invalidate both instructor and student library queries for immediate updates
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      queryClient.invalidateQueries({ queryKey: ['student-library'] });
      
      // Show specific success message for status changes
      if (data.isPublished !== undefined) {
        if (data.isPublished) {
          toast({
            title: "Material Published Successfully",
            description: "Material is now visible to students.",
          });
        } else {
          toast({
            title: "Material Status Updated",
            description: "Material has been saved as a draft.",
          });
        }
      } else {
        toast({
          title: "Material Updated Successfully",
          description: "Material has been updated.",
        });
      }
    } catch (error) {
      console.error('Failed to edit material:', error);
      toast({
        title: "Failed to Update Material",
        description: "There was an error updating the material. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Wrapper function for edit mode to match AddMaterialForm signature
  const handleEditMaterialWrapper = async (data: CreateMaterialRequest) => {
    if (editingMaterial) {
      await handleEditMaterial(editingMaterial._id, data);
    }
  };

  const handleDeleteMaterial = async (id: string, type?: string) => {
    try {
      await deleteMaterialMutationFn(id, type);
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      await loadMaterials();
      toast({
        title: "Material Deleted Successfully",
        description: "Material has been removed from your library.",
      });
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast({
        title: "Failed to Delete Material",
        description: "There was an error deleting the material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File, materialData: Omit<CreateMaterialRequest, 'file'>) => {
    try {
      // Create a complete request with file data
      const requestData: CreateMaterialRequest = {
        ...materialData,
        file: file
      };
      
      // Create the material first
      const createResponse = await createLibraryBookMutationFn(requestData);
      
      // Get the created item ID and type from response
      const itemId = createResponse?.material?.id;
      const itemType = requestData.type || 'book';
      
      if (itemId) {
        // Call complete-upload endpoint to finalize file processing
        await completeUploadMutationFn(itemId, itemType);
        
        // Invalidate both instructor and student library queries for immediate updates
        queryClient.invalidateQueries({ queryKey: ['library-items'] });
        queryClient.invalidateQueries({ queryKey: ['student-library'] });
        
        // Show success message
        toast({
          title: "Upload Complete",
          description: "File has been uploaded and processed successfully.",
        });
      }
      
      await loadMaterials();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to upload material:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the material. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-full w-full pb-16">
      {/* Hero Section */}
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
          {/* Help Dialog - Top Right Position */}
          <div className="absolute top-4 right-0 z-20">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Need help?"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Material Library Management</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <ul className="list-disc pl-5 space-y-2 mt-2 text-base">
                        <li>
                          <b>Add Materials:</b> Click "Add Material" to create new educational content.
                        </li>
                        <li>
                          <b>Edit Materials:</b> Use the edit button on any material card to modify it.
                        </li>
                        <li>
                          <b>Delete Materials:</b> Remove unwanted materials using the delete button.
                        </li>
                        <li>
                          <b>Track Performance:</b> Monitor downloads and views in the statistics above.
                        </li>
                      </ul>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                  <Button variant="outline" className="mt-4 w-full">Close</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
          
          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Instructor hub
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Material Library Management</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Create, manage, and organize educational materials for your students.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 px-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                  <DialogDescription>
                    Create a new material for your students.
                  </DialogDescription>
                </DialogHeader>
                <AddMaterialForm 
                  onSubmit={handleAddMaterial}
                  onFileUpload={handleFileUpload}
                  onCancel={() => setIsAddModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Edit Material Modal */}
            <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Material</DialogTitle>
                  <DialogDescription>
                    Update the material information.
                  </DialogDescription>
                </DialogHeader>
                {editingMaterial && (
                  <AddMaterialForm 
                    onSubmit={handleEditMaterialWrapper}
                    onFileUpload={handleFileUpload}
                    onCancel={() => setEditingMaterial(null)}
                    initialData={editingMaterial}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Statistics Pills - Exact Student Style Match */}
          {loading ? (
            // Skeleton Loaders for Statistics Cards (3 columns)
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
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
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
              {/* Pill 1: MATERIALS */}
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-3xl font-semibold tabular-nums">{calculatedStats.totalMaterials}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  MATERIALS
                </div>
              </div>
              
              {/* Pill 2: TOPICS */}
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-3xl font-semibold tabular-nums">
                  {calculatedStats.totalTopics}
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  TOPICS
                </div>
              </div>
              
              {/* Pill 3: DOWNLOADS */}
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-3xl font-semibold tabular-nums">{calculatedStats.totalDownloads}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  DOWNLOADS
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search materials by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Materials Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {loading ? (
            // Skeleton Loaders for Material Cards
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
          ) : (
            filteredMaterials.map((material) => (
              <Card key={material._id} className="h-full flex flex-col justify-between shadow-md border hover:shadow-2xl hover:-translate-y-1 group relative transition-all duration-300 ease-out">
              {/* Material Type Badge */}
              <span className="absolute top-4 right-4 z-10 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow">
                {material.type}
              </span>
              
              {/* Status Badge */}
              <span className={`absolute top-4 left-4 z-10 text-xs font-bold px-2 py-1 rounded shadow ${
                material.status === 'PUBLISHED' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {material.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
              
              <CardHeader className="flex flex-col items-center gap-2">
                {getMaterialIcon(material.type)}
                <CardTitle className="text-xl text-center line-clamp-2">
                  {material.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                  {material.summary || material.description || 'No description available'}
                </p>
                
                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    {material.downloadCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Book className="w-3 h-3" />
                    {material.viewCount || 0}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        disabled={!material.fileAssetId?.urls?.streamUrl && !material.fileUrl}
                        onClick={() => handleViewMaterial(material)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {material.fileAssetId?.urls?.streamUrl 
                          ? "Open material in new tab" 
                          : material.fileAssetId 
                            ? "Processing file..." 
                            : material.fileUrl 
                              ? "Open material in new tab" 
                              : "No file attached"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingMaterial(material)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDeleteMaterial(material._id, material.type)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          )}
          
          {/* Add New Material Card */}
          <Card className="h-full flex flex-col justify-center items-center shadow-md border border-dashed border-primary/30 hover:border-primary/50 hover:shadow-xl group cursor-pointer" onClick={() => setIsAddModalOpen(true)}>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Plus className="w-12 h-12 text-primary/50 group-hover:text-primary" />
              <h3 className="text-lg font-semibold text-center">Add New Material</h3>
              <p className="text-center text-muted-foreground text-sm">
                Create a new educational resource for your students
              </p>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Material
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

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

// Add Material Form Component
function AddMaterialForm({ 
  onSubmit, 
  onFileUpload, 
  onCancel,
  initialData 
}: { 
  onSubmit: (data: CreateMaterialRequest) => void;
  onFileUpload: (file: File, data: Omit<CreateMaterialRequest, 'file'>) => void;
  onCancel: () => void;
  initialData?: Material;
}) {
  const [formData, setFormData] = useState<CreateMaterialRequest>({
    title: '',
    description: '',
    type: 'book',
    tags: [],
    category: '',
    isPublic: false,
    topicId: '',
    isPublished: true
  });

  // Pre-fill form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        type: initialData.type,
        tags: [],
        category: '',
        isPublic: false,
        topicId: initialData.topics[0] || '', // Use first topic
        isPublished: initialData.status === 'PUBLISHED'
      });
    }
  }, [initialData]);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onFileUpload(file, formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'book' | 'visual-guide' | 'presentation' })}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="book" className="bg-background text-foreground">Books</option>
            <option value="visual-guide" className="bg-background text-foreground">Visual Guides</option>
            <option value="presentation" className="bg-background text-foreground">Presentations</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <select
            value={formData.topicId}
            onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {staticTopics.map((topic) => (
              <option key={topic.value} value={topic.value} className="bg-background text-foreground">
                {topic.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">File (optional)</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Publish to Students</label>
            <p className="text-xs text-muted-foreground mt-1">
              If disabled, material will be saved as a draft.
            </p>
          </div>
          <Switch
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Add Material
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
