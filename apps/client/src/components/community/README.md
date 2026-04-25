# Community Image Gallery Components

This directory contains LinkedIn-style image gallery components for the community feed feature.

## Components

### 1. LinkedInImageGallerySimple
A simple LinkedIn-style image gallery without lightbox functionality.

**Features:**
- Responsive layouts for 1-5+ images
- LinkedIn-style grid layouts
- Hover effects and transitions
- Loading states with skeleton animation
- "+X more" overlay for 5+ images

**Usage:**
```tsx
import { LinkedInImageGallerySimple } from "@/components/community/linkedin-image-gallery-simple";

<LinkedInImageGallerySimple 
  images={imageUrls}
  onImageClick={(index) => console.log("Clicked image", index)}
  className="my-4"
/>
```

### 2. LinkedInImageGalleryWithLightbox
A full-featured LinkedIn-style gallery with lightbox functionality.

**Features:**
- All features from the simple version
- Full-screen lightbox gallery
- Keyboard navigation (Arrow keys, Escape)
- Image counter
- Navigation buttons
- Body scroll lock when lightbox is open

**Usage:**
```tsx
import { LinkedInImageGalleryWithLightbox } from "@/components/community/linkedin-image-gallery-with-lightbox";

<LinkedInImageGalleryWithLightbox 
  images={imageUrls}
  className="my-4"
/>
```

## Layout Specifications

### 1 Image
- Full width display
- Aspect ratio: 4:3
- Max height: 600px

### 2 Images
- Side-by-side layout
- 2-column grid
- Equal height and width

### 3 Images
- One large image on the left (spans 2 rows)
- Two stacked images on the right
- Asymmetric layout for visual interest

### 4 Images
- 2x2 grid layout
- All images equal size
- Perfect square layout

### 5+ Images
- 3x2 grid layout
- Shows first 5 images
- "+X more" overlay on the last image
- Indicates additional images not shown

## Technical Implementation

### Responsive Design
- Uses CSS Grid for layout
- Maintains aspect ratios
- Responsive breakpoints
- Mobile-friendly

### Performance
- Lazy loading for images
- Object-fit: cover for proper cropping
- Loading states with skeleton animation
- Memory-efficient event handling

### Accessibility
- Keyboard navigation support
- Proper ARIA labels
- Focus management
- Screen reader friendly

## Integration

The gallery is already integrated into the `PostMediaGallery` function in `community-page-client.tsx`. To use it:

1. Import the desired component
2. Pass the images array (URLs)
3. Optional: pass click handlers and custom classes

## Styling

The components use:
- Tailwind CSS classes
- Consistent with your design system
- Smooth transitions and hover effects
- Modern, clean appearance similar to LinkedIn

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid support required
- ES6+ JavaScript features
