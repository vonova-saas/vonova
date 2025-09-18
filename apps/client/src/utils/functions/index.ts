import { cn } from "./app/cn";
import {
  transformOptions,
  transformStatusEnum,
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText
} from "./app/helper";
import { generateMetadata } from "./app/metadata";
import { 
  LocalStorage,
  addRecentRoadmap,
  getRecentRoadmaps,
  removeRecentRoadmap,
  saveRecentRoadmaps
 } from "./app/local-storage";

// blogs
import {
  formatDate,
  formatDate2,
  stringToDate
} from "./app/helper";

// import {
//   Author,
//   getAllBlogStaticPaths,
//   getBlogForSlug,
//   BlogMdxFrontmatter, 
//   getAllBlogs,
// } from "./blog/markdown";

export {
  // app
  cn,
  generateMetadata,
  transformOptions,
  transformStatusEnum,
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText,
  // local storage
  LocalStorage,
  addRecentRoadmap,
  getRecentRoadmaps,
  removeRecentRoadmap,
  saveRecentRoadmaps,
  // blog
  formatDate,
  formatDate2,
  stringToDate,
  // type Author,
  // getAllBlogStaticPaths,
  // getBlogForSlug,
  // type BlogMdxFrontmatter, 
  // getAllBlogs,
}