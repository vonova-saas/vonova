// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { compileMDX } from "next-mdx-remote/rsc";
// import remarkGfm from "remark-gfm";
// import rehypePrism from "rehype-prism-plus";
// import rehypeAutolinkHeadings from "rehype-autolink-headings";
// import rehypeSlug from "rehype-slug";
// import rehypeCodeTitles from "rehype-code-titles";
// import { visit } from "unist-util-visit";

// // custom components imports
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Pre from "@/components/marketing/company/blog/pre";
// import Note from "@/components/marketing/company/blog/note";
// import { Stepper, StepperItem } from "@/components/ui/stepper";

// // add custom components
// const components = {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
//   pre: Pre,
//   Note,
//   Stepper,
//   StepperItem,
// };

// // can be used for other pages like blogs, Guides etc
// async function parseMdx<Frontmatter>(rawMdx: string) {
//   return await compileMDX<Frontmatter>({
//     source: rawMdx,
//     options: {
//       parseFrontmatter: true,
//       mdxOptions: {
//         rehypePlugins: [
//           preProcess,
//           rehypeCodeTitles,
//           rehypePrism,
//           rehypeSlug,
//           rehypeAutolinkHeadings,
//           postProcess,
//         ],
//         remarkPlugins: [remarkGfm],
//       },
//     },
//     components,
//   });
// }

// // logic for docs

// type BaseMdxFrontmatter = {
//   title: string;
//   description: string;
// };

// // for copying the code
// const preProcess = () => (tree: any) => {
//   visit(tree, (node) => {
//     if (node?.type === "element" && node?.tagName === "pre") {
//       const [codeEl] = node.children;
//       if (codeEl.tagName !== "code") return;
//       node.raw = codeEl.children?.[0].value;
//     }
//   });
// };

// const postProcess = () => (tree: any) => {
//   visit(tree, "element", (node) => {
//     if (node?.type === "element" && node?.tagName === "pre") {
//       node.properties["raw"] = node.raw;
//     }
//   });
// };

// export type Author = {
//   avatar?: string;
//   handle: string;
//   username: string;
//   handleUrl: string;
// };

// export type BlogMdxFrontmatter = BaseMdxFrontmatter & {
//   date: string;
//   authors: Author[];
// };

// export async function getAllBlogStaticPaths() {
//   // Ensure this only runs on the server side
//   if (typeof window !== 'undefined') {
//     throw new Error('This function can only be called on the server side');
//   }
  
//   try {
//     // Dynamic imports to avoid client-side issues
//     const path = (await import("path")).default;
//     const fs = (await import("fs")).promises;
    
//     const blogFolder = path.join(process.cwd(), "src/contents/blogs/");
//     const res = await fs.readdir(blogFolder);
//     return res.map((file) => file.split(".")[0]);
//   } catch (err) {
//     console.log(err);
//   }
// }

// export async function getAllBlogs() {
//   // Ensure this only runs on the server side
//   if (typeof window !== 'undefined') {
//     throw new Error('This function can only be called on the server side');
//   }
  
//   try {
//     // Dynamic imports to avoid client-side issues
//     const path = (await import("path")).default;
//     const fs = (await import("fs")).promises;
    
//     const blogFolder = path.join(process.cwd(), "src/contents/blogs/");
//     // Check if directory exists
//     try {
//       await fs.access(blogFolder);
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (err) {
//       console.error('Blogs directory does not exist:', blogFolder);
//       return [];
//     }

//     const files = await fs.readdir(blogFolder);    
//     if (!files || files.length === 0) {
//       return [];
//     }

//     const blogPromises = files
//       .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
//       .map(async (file) => {
//         try {
//           const filepath = path.join(blogFolder, file);
//           console.log('Processing blog file:', filepath);
//           const rawMdx = await fs.readFile(filepath, "utf-8");
//           const parsed = await parseMdx<BlogMdxFrontmatter>(rawMdx);
//           return {
//             ...parsed,
//             slug: file.split(".")[0],
//           };
//         } catch (error) {
//           console.error(`Error processing blog file ${file}:`, error);
//           return null;
//         }
//       });

//     const blogs = await Promise.all(blogPromises);
//     // Filter out any null values from failed parses
//     return blogs.filter((blog): blog is NonNullable<typeof blog> => blog !== null);
//   } catch (error) {
//     console.error('Error in getAllBlogs:', error);
//     return [];
//   }
// }

// export async function getBlogForSlug(slug: string) {
//   // Ensure this only runs on the server side
//   if (typeof window !== 'undefined') {
//     throw new Error('This function can only be called on the server side');
//   }
  
//   const blogs = await getAllBlogs();
//   return blogs.find((it) => it.slug == slug);
// }
