# Sticker Pages Design and Requirements

This document outlines the design specifications and requirements for the sticker pages in the Saint Calendar Next.js/React application. The stickers feature is divided into two main subsections: **Gallery** and **Templates** (renamed from the previous "Favorites"). The overall navigation under the "Stickers" menu will be updated to reflect these changes, with the separate "Search" menu item removed and its functionality integrated directly into the Gallery page. This design ensures a streamlined user experience, reducing navigation complexity while providing robust search capabilities within the Gallery.

The following sections detail the navigation updates, UI designs for each subsection, and integration notes. All designs prioritize responsive layouts using Tailwind CSS (consistent with the project's styling), accessibility (e.g., ARIA labels, keyboard navigation), and integration with the existing Prisma database for sticker data retrieval.

## Navigation Changes

To simplify the sticker-related navigation and consolidate functionality, the following updates are required in the sidebar navigation component ([`components/layout/sidebar-navigation.tsx`](components/layout/sidebar-navigation.tsx)) and any related routing logic in [`app/layout.tsx`](app/layout.tsx) or Next.js routing files:

- **Rename "Favorites" to "Templates"**: In the Stickers menu dropdown or subsection, change the label from "Favorites" to "Templates". This reflects the new focus on sticker size templates rather than user-saved favorites.
  
- **Remove "Search" Menu Item**: Eliminate the separate "Search" item from the Stickers menu. Search functionality will be merged into the Gallery page, avoiding redundant navigation.

- **Add/Ensure Routing Links to Gallery and Templates**:
  - **Gallery**: Route to `/stickers/gallery` (or equivalent dynamic route). This page will display a grid of stickers fetched from the database via the existing API endpoint ([`app/api/stickers/route.ts`](app/api/stickers/route.ts)). Include a link in the Stickers menu labeled "Gallery".
  - **Templates**: Route to `/stickers/templates`. This page will be static or semi-dynamic, listing predefined sticker sizes with external links. Add a link in the Stickers menu labeled "Templates".
  
- **Updated Menu Structure (ASCII Art Representation)**:
  ```
  Stickers (Main Menu Item)
  ├── Gallery (Link to /stickers/gallery)
  └── Templates (Link to /stickers/templates)
  ```
  - No nested search item.
  - Ensure active states and hover effects using the existing UI components like [`components/ui/dropdown-menu.tsx`](components/ui/dropdown-menu.tsx).

- **Routing Implementation Notes**:
  - Use Next.js App Router for client-side navigation with `useRouter` from `next/navigation`.
  - Update any hardcoded links in [`components/layout/sidebar.tsx`](components/layout/sidebar.tsx) to match the new routes.
  - Ensure the main Stickers entry point (e.g., `/stickers`) redirects to `/stickers/gallery` as the default view.

These changes should be applied without affecting other menu sections (e.g., Calendar, Saints).

## Gallery Section

The Gallery page (`/stickers/gallery`) serves as the primary interface for browsing and searching stickers stored in the database. It integrates search functionality directly into the UI, eliminating the need for a separate search page. Stickers are fetched from the Prisma database using the saints and stickers models (refer to [`prisma/schema.prisma`](prisma/schema.prisma) for schema details). The design emphasizes a clean, searchable grid layout for easy discovery.

### UI Interface Design

- **Overall Layout**:
  - **Header**: App header with breadcrumb navigation (e.g., Home > Stickers > Gallery).
  - **Search Bar at Top**: A prominent, full-width search input with filters. Use the existing [`components/ui/input.tsx`](components/ui/input.tsx) and [`components/ui/select.tsx`](components/ui/select.tsx) components.
  - **Filters Sidebar (Collapsible on Mobile)**: Optional sidebar for advanced filters, integrated with the main content area using responsive Tailwind classes (e.g., `md:flex`).
  - **Main Content**: Grid of sticker cards below the search bar, paginated for performance.
  - **Footer**: Pagination controls and export options (e.g., download selected stickers).

- **Integrated Search Functionality**:
  - **Search Bar**: Single input field for free-text search across Saint Name, Year, and Location fields. On submit or real-time typing (debounced), query the database via API (enhance [`app/api/stickers/route.ts`](app/api/stickers/route.ts) to handle query params like `?search=query&filter=year:2023`).
  - **Filters**:
    - **Saint Name**: Dropdown or autocomplete select populated from saints table (e.g., "St. Patrick", "St. Theresa").
    - **Year**: Numeric range slider or select (e.g., 1900-2025), filtered from sticker metadata.
    - **Location**: Multi-select dropdown from locations table (e.g., "New York", "Rome"), using state abbreviations or full names.
    - Additional filters: Sticker type (e.g., "Holiday", "Patron Saint"), Size (small/medium/large).
  - **Search Behavior**: Results update dynamically without page reload using React state and `useEffect` for API calls. Display "No results found" with suggestions if empty.
  - **Sorting**: Dropdown for sort by (e.g., Relevance, Date Added, Saint Name).

- **Sticker Cards Grid**:
  - Responsive grid (e.g., 1-col mobile, 3-col desktop) using CSS Grid or Flexbox.
  - Each card: Image preview (from public/stickers or generated), Saint name, Year, Location badge, and actions (e.g., View Details, Add to Calendar).
  - Use [`components/ui/card.tsx`](components/ui/card.tsx) for card styling.

- **Mockup Description (ASCII Art)**:
  ```
  +---------------------------------------------------+
  | Header: Saint Calendar > Stickers > Gallery       |
  +---------------------------------------------------+
  | Search Bar: [Search stickers...]  [Search Button] |
  | Filters: Saint: [Dropdown]  Year: [Slider]        |
  |         Location: [Multi-select]  Type: [Checkbox]|
  +---------------------------------------------------+
  | Sticker Grid:                                     |
  | +----------+ +----------+ +----------+            |
  | | [Image]  | | [Image]  | | [Image]  | ...        |
  | | St. John | | St. Mary | | St. Paul |            |
  | | 2020     | | 2015     | | 2023     |            |
  | | NY       | | Rome     | | CA       |            |
  | | [View]   | | [View]   | | [View]   |            |
  | +----------+ +----------+ +----------+            |
  |                                                   |
  | Pagination: < Prev  1 2 3 ... 10 Next >           |
  +---------------------------------------------------+
  ```
  - On mobile, filters collapse into a modal using [`components/ui/dialog.tsx`](components/ui/dialog.tsx).
  - Ensure lazy loading for images and infinite scroll option for better UX.

- **Technical Requirements**:
  - Database Query: Use Prisma client in API route to filter/join saints, locations, and stickers tables.
  - State Management: Use React hooks or Context for filter state.
  - Accessibility: Label filters properly, ensure grid is navigable via keyboard.

## Templates Section

The Templates page (`/stickers/templates`) provides users with predefined sticker size options and recommendations for printing/external resources. This replaces the "Favorites" functionality, focusing on utility rather than personalization. The page is mostly static but can include dynamic elements like user preferences if expanded later.

### UI Designs

- **Overall Layout**:
  - **Header**: Breadcrumb (Home > Stickers > Templates).
  - **Main Content**: Card-based list of sticker sizes, each with description, dimensions, and external links.
  - **Sidebar (Optional)**: Quick links to recommended sites or size calculator.
  - **Footer**: Call-to-action for Gallery integration (e.g., "Browse stickers to customize").

- **Sticker Sizes Display**:
  - Sections for each size: Small (e.g., 1x1 inch), Medium (2x2 inch), Large (4x4 inch).
  - Each card: Visual mockup (SVG or image), dimensions, use cases (e.g., "Ideal for calendar badges"), and links to templates.
  - External Links: To recommended sites like Sticker Mule (https://www.stickermule.com/) and Vistaprint (https://www.vistaprint.com/). Ensure links open in new tabs with `target="_blank"`.
  - Interactive Elements: Hover previews or modals for template downloads.

- **Mockup Description (ASCII Art)**:
  ```
  +---------------------------------------------------+
  | Header: Saint Calendar > Stickers > Templates     |
  +---------------------------------------------------+
  | Introduction: Choose a sticker size and customize |
  | with saints from the Gallery.                     |
  +---------------------------------------------------+
  | Size Cards:                                       |
  | +-------------------+                             |
  | | Small (1x1")      |                             |
  | | [Square Image]    |                             |
  | | Use: Badges       |                             |
  | | Links: [Sticker   |                             |
  | | Mule] [Template]  |                             |
  | +-------------------+                             |
  |                                                   |
  | +-------------------+  +-------------------+      |
  | | Medium (2x2")     |  | Large (4x4")      |      |
  | | [Square Image]    |  | [Large Image]     |      |
  | | Use: Events       |  | Use: Posters      |      |
  | | Links: [Vistaprint|  | Links: [Download] |      |
  | | ] [Preview]       |  | [Site]            |      |
  | +-------------------+  +-------------------+      |
  +---------------------------------------------------+
  | Recommended Sites: Sticker Mule | Vistaprint      |
  +---------------------------------------------------+
  ```
  - Responsive: Stack cards vertically on mobile.
  - Use existing UI components like [`components/ui/badge.tsx`](components/ui/badge.tsx) for size labels.

- **Technical Requirements**:
  - Static Content: Hardcode sizes and links in a new component (e.g., `components/sections/stickers/templates-section.tsx`).
  - Integration: Button to "Generate Sticker" linking back to Gallery with pre-selected size filter.
  - No Database Dependency: Purely frontend unless user-saved templates are added later.

## Integration

- **Merging Search into Gallery**: By removing the separate Search page, all search logic (previously in a dedicated component like [`components/sections/saints/saint-search.tsx`](components/sections/saints/saint-search.tsx)) is relocated to the Gallery page. Reuse and adapt the existing search component for stickers, querying the stickers API instead of saints. This reduces code duplication and improves flow—users searching for stickers land directly in the visual Gallery.

- **Cross-Section Linking**: 
  - From Templates: "Find matching saints in Gallery" button that navigates to `/stickers/gallery` with a size filter applied (e.g., `?size=small`).
  - From Gallery: "Get Templates for this size" link on each card, routing to Templates with highlighted section.

- **Performance and SEO Considerations**:
  - Server-Side Rendering (SSR) for initial Gallery load using Next.js `getServerSideProps` or App Router equivalents to pre-fetch stickers.
  - Meta tags: Update page titles/descriptions for `/stickers/gallery` and `/stickers/templates`.
  - Error Handling: Graceful fallbacks for API failures (e.g., offline mode showing cached stickers).

This design ensures the sticker pages are intuitive, searchable, and integrated seamlessly with the Saint Calendar app. Future expansions could include user-generated templates or advanced filtering.