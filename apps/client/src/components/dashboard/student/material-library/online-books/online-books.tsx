"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from "@/components/ui/pagination";

const fakeBooks = [
  {
    id: "clean-code",
    title: "Clean Code",
    author: "Robert C. Martin",
    cover: "/images/placeholder.svg",
    description: "A handbook of agile software craftsmanship and best coding practices.",
    topic: "Programming",
  },
  {
    id: "design-patterns",
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    cover: "/images/placeholder.svg",
    description: "A classic book on software design patterns and best practices.",
    topic: "Architecture",
  },
  {
    id: "refactoring",
    title: "Refactoring: Improving the Design of Existing Code",
    author: "Martin Fowler",
    cover: "/images/placeholder.svg",
    description: "A guide to refactoring code for better readability and maintainability.",
    topic: "Programming",
  },
  {
    id: "continuous-delivery",
    title: "Continuous Delivery",
    author: "Jez Humble, David Farley",
    cover: "/images/placeholder.svg",
    description: "Principles and practices for building and deploying software reliably.",
    topic: "DevOps",
  },
  {
    id: "tdd",
    title: "Test-Driven Development: By Example",
    author: "Kent Beck",
    cover: "/images/placeholder.svg",
    description: "A practical guide to TDD and writing reliable, maintainable code.",
    topic: "Testing",
  },
  {
    id: "domain-driven-design",
    title: "Domain-Driven Design: Tackling Complexity in the Heart of Software",
    author: "Eric Evans",
    cover: "/images/placeholder.svg",
    description: "A comprehensive look at domain-driven design for complex software projects.",
    topic: "Architecture",
  },
  {
    id: "pragmatic-programmer",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    cover: "/images/placeholder.svg",
    description: "Tips and techniques for becoming a better, more effective programmer.",
    topic: "Programming",
  },
  {
    id: "microservices",
    title: "Building Microservices",
    author: "Sam Newman",
    cover: "/images/placeholder.svg",
    description: "A practical guide to designing and building microservices architectures.",
    topic: "Architecture",
  },
  {
    id: "effective-java",
    title: "Effective Java",
    author: "Joshua Bloch",
    cover: "/images/placeholder.svg",
    description: "Best practices for writing robust, maintainable Java code.",
    topic: "Programming",
  },
  {
    id: "you-dont-know-js",
    title: "You Don’t Know JS Yet",
    author: "Kyle Simpson",
    cover: "/images/placeholder.svg",
    description: "A deep dive into the core mechanisms of the JavaScript language.",
    topic: "Web",
  },
  {
    id: "release-it",
    title: "Release It!",
    author: "Michael T. Nygard",
    cover: "/images/placeholder.svg",
    description: "Design and deploy production-ready software that survives real-world conditions.",
    topic: "DevOps",
  },
  {
    id: "working-effectively-with-legacy-code",
    title: "Working Effectively with Legacy Code",
    author: "Michael Feathers",
    cover: "/images/placeholder.svg",
    description: "Strategies for maintaining and improving legacy software systems.",
    topic: "Programming",
  },
  {
    id: "soft-skills",
    title: "Soft Skills: The software developer's life manual",
    author: "John Sonmez",
    cover: "/images/placeholder.svg",
    description: "A guide to the non-technical skills every software engineer needs.",
    topic: "CS",
  },
  {
    id: "infrastructure-as-code",
    title: "Infrastructure as Code",
    author: "Kief Morris",
    cover: "/images/placeholder.svg",
    description: "Managing servers, cloud, and automation with code.",
    topic: "DevOps",
  },
  {
    id: "clean-architecture",
    title: "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
    author: "Robert C. Martin",
    cover: "/images/placeholder.svg",
    description: "A guide to designing robust, maintainable software architectures.",
    topic: "Architecture",
  },
];

const topics = ["All", "Programming", "Web", "Mobile", "CS"];

export default function OnlineBooks() {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filter books by search and topic
  const filteredBooks = useMemo(() => {
    return fakeBooks.filter((book) => {
      const matchesTopic = topic === "All" || book.topic === topic;
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.description.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [search, topic]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const paginatedBooks = filteredBooks.slice((page - 1) * pageSize, page * pageSize);

  // Reset to first page when filter/search changes
  React.useEffect(() => {
    setPage(1);
  }, [search, topic]);

  // Overview stats
  const totalBooks = fakeBooks.length;
  const uniqueTopics = Array.from(new Set(fakeBooks.map((b) => b.topic)));

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center overflow-auto relative bg-background p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* <h2 className="text-3xl font-bold mb-6 text-center">Free Online Books</h2> */}
      {/* Overview Card */}
      <Card className="w-full max-w-3xl mb-6 shadow-lg border-2 backdrop-blur-sm">
        <CardContent className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Icon and Main Stat */}
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-primary drop-shadow-sm">
                  {totalBooks}
                </span>
                <span className="text-base font-medium text-muted-foreground mb-1">
                  Books
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                  {uniqueTopics.length} Topics
                </span>
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                  {fakeBooks.length} Total
                </span>
              </div>
            </div>
          </div>
          {/* Motivational Message */}
          <div className="flex-1 text-center md:text-right flex flex-col justify-center">
            <span className="text-lg font-semibold text-primary">
              Expand your knowledge!
            </span>
            <span className="text-muted-foreground text-sm mt-1">
              Browse and read free computer science books to boost your learning
              journey.
            </span>
          </div>
        </CardContent>
      </Card>
      {/* Search and Filter */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-8 mx-auto">
        <div className="relative flex-1">
          <Input
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        </div>
        <div className="relative w-[90px]">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
        </div>
      </div>
      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-16 h-16 text-primary/20 mb-4" />
          <span className="text-lg font-semibold text-muted-foreground mb-2">
            No books found
          </span>
          <span className="text-sm text-muted-foreground">
            Try adjusting your search or filter to find books.
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedBooks.map((book) => (
              <Card key={book.id} className="flex flex-col h-full group">
                <CardHeader className="flex flex-col items-center gap-2 pb-2">
                  <div className="w-24 h-32 bg-muted rounded shadow overflow-hidden mb-2 flex items-center justify-center">
                    <Image
                      src={book.cover}
                      alt={book.title + " cover"}
                      width={96}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardTitle className="text-lg text-center line-clamp-2">
                    {book.title}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground text-center">
                    by {book.author}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center line-clamp-3 mb-2">
                    {book.description}
                  </p>
                  <Button asChild className="w-full mt-auto">
                    <Link
                      href={`/dashboard/material-library/online-books/${book.id}`}
                    >
                      Read Book
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && filteredBooks.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page === 1}
                      tabIndex={page === 1 ? -1 : 0}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink isActive={page === idx + 1} onClick={() => setPage(idx + 1)}>{idx + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-disabled={page === totalPages}
                      tabIndex={page === totalPages ? -1 : 0}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
