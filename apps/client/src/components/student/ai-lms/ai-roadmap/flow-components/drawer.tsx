/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/stores";
import { IOrilley } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { searchYoutube } from "@/lib/youtube";
import { YouTubeEmbed } from "@next/third-parties/google";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface DrawerProps {
  roadmapId?: string;
}

// Inline logic for findSavedNodeDetails and saveNodeDetails
const findSavedNodeDetails = async (_roadmapId: string, _nodeName: string) =>
  false;
const saveNodeDetails = async (
  _roadmapId: string,
  _nodeName: string,
  _content: string,
  _books: string,
  _youtubeVideoIds: string[],
) => {};

export const Drawer = ({ roadmapId }: DrawerProps) => {
  const [drawerData, setDrawerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { drawerOpen, toggleDrawer, drawerDetails, model, modelApiKey } =
    useUIStore(
      useShallow((state) => ({
        drawerOpen: state.drawerOpen,
        toggleDrawer: state.toggleDrawer,
        drawerDetails: state.drawerDetails,
        modelApiKey: state.modelApiKey,
        model: state.model,
      })),
    );

  const nodeName = `${drawerDetails?.query}_${drawerDetails?.parent}_${drawerDetails?.child}`;

  const fetchDetailsData = useCallback(async () => {
    if (!roadmapId) {
      setErrorMessage("Missing roadmapId.");
      return null;
    }
    if (!drawerDetails?.query || !drawerDetails?.child || !drawerDetails?.parent) {
      setErrorMessage("Missing required drawer details.");
      return null;
    }

    try {
      const apiKeyParam = modelApiKey ? encodeURIComponent(modelApiKey) : "";
      const response = await axios.post(
        `/api/v1/${model}/details?apiKey=${apiKeyParam}&roadmapId=${encodeURIComponent(roadmapId)}`,
        {
          query: drawerDetails?.query,
          child: drawerDetails?.child,
          parent: drawerDetails?.parent,
        },
      );
      return response.data.text;
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message ||
        "Error fetching details data.";
      setErrorMessage(message);
      console.warn("Error fetching details data:", message);
      return null;
    }
  }, [
    model,
    modelApiKey,
    roadmapId,
    drawerDetails?.query,
    drawerDetails?.child,
    drawerDetails?.parent,
  ]);

  const fetchBooksData = useCallback(async () => {
    if (!drawerDetails?.child) {
      setErrorMessage("Missing required drawer details.");
      return null;
    }
    try {
      const response = await axios.post(`/api/v1/orilley`, {
        data: { query: drawerDetails?.child },
      });
      return response.data.data.results;
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as Error)?.message ||
        "Error fetching books data.";
      setErrorMessage(message);
      console.warn("Error fetching books data:", message);
      return null;
    }
  }, [drawerDetails?.child]);

  const fetchDataFromAPIs = useCallback(async () => {
    const detailsData = await fetchDetailsData();
    const videoIds = await searchYoutube(
      `${drawerDetails?.query} ${drawerDetails?.parent} ${drawerDetails?.child}`,
    );
    const booksData = await fetchBooksData();

    return { detailsData, videoIds, booksData };
  }, [
    fetchDetailsData,
    fetchBooksData,
    drawerDetails?.query,
    drawerDetails?.parent,
    drawerDetails?.child,
  ]);

  useEffect(() => {
    const fetchAndSaveData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setDrawerData(null);

      try {
        const existingDetails = await findSavedNodeDetails(
          roadmapId!,
          nodeName,
        );

        if (existingDetails && typeof existingDetails === "object") {
          const { youtubeVideoIds, details, books } = existingDetails;

          setDrawerData({
            detailsData: JSON.parse(details),
            videoIds: youtubeVideoIds as string[],
            booksData: JSON.parse(books),
            isSuccess: true,
          });
        } else {
          const { detailsData, videoIds, booksData } =
            await fetchDataFromAPIs();

          const shouldSaveNodeDetails =
            roadmapId &&
            nodeName &&
            videoIds &&
            videoIds.length > 0 &&
            JSON.stringify(detailsData) !== "null" &&
            detailsData;

          if (shouldSaveNodeDetails) {
            await saveNodeDetails(
              roadmapId,
              nodeName,
              JSON.stringify(detailsData),
              JSON.stringify(booksData),
              videoIds,
            );
          }

          setDrawerData({
            detailsData,
            videoIds: videoIds as string[],
            booksData: booksData,
            isSuccess: true,
          });
        }
      } catch (error) {
        const message =
          (error as any)?.response?.data?.message ||
          (error as Error)?.message ||
          "Error fetching resources.";
        setErrorMessage(message);
        console.warn("Error fetching or saving data:", message);
      } finally {
        setIsLoading(false);
      }
    };

    if (
      roadmapId &&
      drawerDetails?.query &&
      drawerDetails?.parent &&
      drawerDetails?.child
    ) {
      fetchAndSaveData();
    }
  }, [
    roadmapId,
    drawerDetails?.query,
    drawerDetails?.parent,
    drawerDetails?.child,
    nodeName,
    fetchDataFromAPIs,
  ]);

  const YoutubeVideo = () => {
    return (
      <div className="mt-4 md:px-12 px-8">
        <Carousel>
          <CarouselContent>
            {drawerData.videoIds &&
              drawerData.videoIds.map((videoId: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <YouTubeEmbed videoid={videoId} />
                  </div>
                </CarouselItem>
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  };

  const ResourceLink = ({
    linkTitle,
    link,
    iconUrl,
    imageUrl,
  }: {
    link: string;
    linkTitle: string;
    iconUrl: string;
    imageUrl?: string;
  }) => {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <a href={link} target="_blank" referrerPolicy="no-referrer">
                <Image
                  src={imageUrl || iconUrl}
                  alt="Wikipedia Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{linkTitle}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    );
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={toggleDrawer}>
      <SheetContent className="overflow-auto min-w-full md:min-w-[700px] bg-background text-foreground p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{drawerDetails?.child ? `${drawerDetails.child} details` : "Details"}</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-background/90">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <span className="text-muted-foreground text-lg">
              Loading resources...
            </span>
          </div>
        ) : errorMessage ? (
          <div className="px-6 py-6">
            <div className="text-sm text-muted-foreground">{errorMessage}</div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="px-6 pt-6 pb-2 border-b border-border">
              <div className="text-xs text-muted-foreground mb-1">
                {drawerDetails?.parent ?? ""}
              </div>
              <div className="text-2xl font-bold mb-1">
                {drawerDetails?.child ?? ""}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {drawerDetails?.query ?? ""}
              </div>
            </div>
            {/* Video Section */}
            {drawerData?.videoIds?.length > 0 && (
              <div className="py-6 px-6 border-b border-border">
                <div className="text-lg font-semibold mb-4">Related Videos</div>
                <YoutubeVideo />
              </div>
            )}
            {/* Resource Links */}
            {drawerData?.detailsData?.link && (
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <ResourceLink
                  link={drawerData?.detailsData?.link ?? ""}
                  linkTitle="Wikipedia"
                  iconUrl="/images/wikipedia.png"
                  imageUrl={
                    drawerData?.detailsData?.thumbnail ||
                    drawerData?.detailsData?.image
                  }
                />
                <span className="text-sm text-muted-foreground">Wikipedia</span>
              </div>
            )}
            {/* Description & Bullet Points */}
            <div className="px-6 py-6 border-b border-border">
              <div className="text-base mb-3 leading-relaxed">
                {drawerData?.detailsData?.description ||
                  drawerData?.detailsData?.extract ||
                  drawerData?.detailsData?.summary ||
                  drawerData?.detailsData?.text ||
                  ""}
              </div>
              {drawerData?.detailsData?.bulletPoints &&
                drawerData?.detailsData?.bulletPoints?.length > 0 && (
                  <ul className="list-disc list-inside space-y-2 pl-4 mt-2 text-sm text-muted-foreground">
                    {drawerData?.detailsData.bulletPoints?.map(
                      (point: string, id: number) => (
                        <li key={id}>{point ?? ""}</li>
                      ),
                    )}
                  </ul>
                )}
            </div>
            {/* Recommended Books */}
            {drawerData?.booksData?.length > 0 && (
              <div className="px-6 py-6">
                <div className="text-lg font-semibold mb-4">
                  Recommended Books
                </div>
                <div className="flex flex-col gap-4">
                  {drawerData?.booksData?.map(
                    (book: IOrilley["data"][number], id: number) => (
                      <a
                        className="flex items-center bg-card rounded-xl shadow hover:shadow-lg border border-border transition p-3 gap-4 hover:bg-primary/5"
                        href={"https://learning.oreilly.com" + book?.web_url}
                        target="_blank"
                        key={book?.id}
                      >
                        <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="w-full h-full object-cover"
                            src={book?.cover_url ?? ""}
                            alt={book?.title ?? ""}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate mb-1">
                            {book?.title ?? ""}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            By {book?.authors?.[0] ?? ""}
                          </div>
                          {book?.duration_seconds > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Complete in{" "}
                              {formatDuration(book?.duration_seconds)}
                            </div>
                          )}
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
