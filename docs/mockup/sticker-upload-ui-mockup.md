# Sticker Upload UI Mockups

## Overview
This document contains mockups for the Admin Sticker Management upload interface. The designs follow the existing application style with green theme and clean, modern aesthetics.

## Mockup 1: Single File Upload Interface

### Main Upload Zone
```
┌─────────────────────────────────────────────────────────────┐
│                    📁 Drop Sticker Here                     │
│                                                             │
│                Or click to browse files                     │
│                                                             │
│                Supported: PNG, JPG, GIF                     │
│                Max size: 5MB per file                       │
│                                                             │
│                [📎 Browse Files]                            │
└─────────────────────────────────────────────────────────────┘
```

### After File Selection
```
┌─────────────────────────────────────────────────────────────┐
│                    📁 Drop Sticker Here                     │
│                                                             │
│                ✅ st-patrick-2024.png selected              │
│                📏 2.3 MB • 800x600px                        │
│                                                             │
│                [📎 Change File]   [🗑️ Remove]               │
└─────────────────────────────────────────────────────────────┘
```

### Association Dialog (Modal)
```
┌─────────────────────────────────────────────────────────────┐
│                🔍 Associate Sticker with Scene              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐    Search for Saint or Location:        │
│ │                 │    ┌───────────────────────────────────┐ │
│ │  [Sticker       │    │ 🔍 Search saints, locations...   │ │
│ │   Preview]      │    └───────────────────────────────────┘ │
│ │                 │                                          │
│ └─────────────────┘    📍 **Search Results:**               │
│                        ┌───────────────────────────────────┐ │
│                        │ 🏛️ St. Patrick's Cathedral - NY   │ │
│                        │    • Saint: St. Patrick           │ │
│                        │    • Event: Annual Celebration    │ │
│                        │    • Year: 2024                   │ │
│                        └───────────────────────────────────┘ │
│                        ┌───────────────────────────────────┐ │
│                        │ 🏛️ St. Patrick's Cathedral - MA   │ │
│                        │    • Saint: St. Patrick           │ │
│                        │    • Event: Community Event       │ │
│                        │    • Year: 2024                   │ │
│                        └───────────────────────────────────┘ │
│                                                             │
│ 📝 **Metadata:**                                           │
│ Year: [2024________] Milestone: [Celebration___________]   │
│ Notes: [Optional notes about this sticker_______________]   │
│                                                             │
│                [❌ Cancel]          [✅ Upload Sticker]     │
└─────────────────────────────────────────────────────────────┘
```

## Mockup 2: Bulk Upload Interface

### Bulk Upload Zone
```
┌─────────────────────────────────────────────────────────────┐
│                   📁📁 Drop Multiple Stickers               │
│                                                             │
│              Or click to browse multiple files              │
│                                                             │
│                Supported: PNG, JPG, GIF                     │
│                Max size: 5MB per file                       │
│                Max files: 10 at once                        │
│                                                             │
│                [📎 Browse Files]                            │
└─────────────────────────────────────────────────────────────┘
```

### File Queue Display
```
📋 **Files to Process (4 selected):**

┌─────────────────────────────────────────────────────────────┐
│ 1. ✅ st-patrick-2024.png      2.3MB  [🗑️] [🔄]           │
│ 2. ⏳ st-nicholas-2024.jpg      1.8MB  [🗑️] [🔄]           │
│ 3. ❌ st-francis-2024.gif      4.2MB  [🗑️] [🔄]           │
│    ⚠️ File too large (max 5MB)                              │
│ 4. ⏳ st-mary-2024.png         2.1MB  [🗑️] [🔄]           │
└─────────────────────────────────────────────────────────────┘

[🔄 Process All Valid]   [🗑️ Clear All]   [❌ Cancel]
```

### Bulk Association Dialog
```
┌─────────────────────────────────────────────────────────────┐
│              🔍 Associate Multiple Stickers                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐    Processing: st-patrick-2024.png      │
│ │                 │    (1 of 3)                             │
│ │  [Sticker       │                                          │
│ │   Preview]      │    Search for Saint or Location:        │
│ │                 │    ┌───────────────────────────────────┐ │
│ └─────────────────┘    │ 🔍 Search saints, locations...   │ │
│                        └───────────────────────────────────┘ │
│                                                             │
│                        📍 **Suggested Matches:**            │
│                        ┌───────────────────────────────────┐ │
│                        │ 🏛️ St. Patrick's Cathedral - NY   │ │
│                        │    • Saint: St. Patrick           │ │
│                        │    • Event: Annual Celebration    │ │
│                        └───────────────────────────────────┘ │
│                                                             │
│ 📝 **Apply to All:**                                        │
│ Year: [2024________] Milestone: [Celebration___________]   │
│ Notes: [Optional notes about this sticker_______________]   │
│                                                             │
│ [⬅️ Previous]   [Skip]   [Apply & Next ➡️]   [Apply to All] │
└─────────────────────────────────────────────────────────────┘
```

## Mockup 3: Approval Management Interface

### Pending Stickers List
```
┌─────────────────────────────────────────────────────────────┐
│                🏷️ Sticker Approval Queue                    │
├─────────────────────────────────────────────────────────────┤
│ 📊 **Status Overview:**                                     │
│ 🔄 Pending: 12   ✅ Approved: 45   ❌ Rejected: 3           │
│                                                             │
│ 🔍 Filter: [All_________] [📅 Date] [👤 Submitter]         │
├─────────────────────────────────────────────────────────────┤
│ 🆕 **st-patrick-2024.png**                                  │
│    Submitted by: John Doe • 2 hours ago                     │
│    Associated: St. Patrick's Cathedral, New York           │
│    Year: 2024 • Milestone: Annual Celebration              │
│    [👁️ Preview] [✅ Approve] [❌ Reject] [💬 Comment]       │
├─────────────────────────────────────────────────────────────┤
│ 🆕 **st-nicholas-2024.jpg**                                 │
│    Submitted by: Jane Smith • 4 hours ago                   │
│    Associated: St. Nicholas Church, Boston                 │
│    Year: 2024 • Milestone: Community Event                 │
│    [👁️ Preview] [✅ Approve] [❌ Reject] [💬 Comment]       │
├─────────────────────────────────────────────────────────────┤
│ 🆕 **st-francis-2024.png**                                  │
│    Submitted by: Bob Wilson • 6 hours ago                   │
│    Associated: St. Francis Chapel, Chicago                 │
│    Year: 2024 • Milestone: Special Service                 │
│    [👁️ Preview] [✅ Approve] [❌ Reject] [💬 Comment]       │
└─────────────────────────────────────────────────────────────┘
```

### Sticker Preview Modal
```
┌─────────────────────────────────────────────────────────────┐
│                👁️ Sticker Preview                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                [Sticker Image Here]                     │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ **Details:**                                                │
│ • File: st-patrick-2024.png                                │
│ • Size: 2.3 MB                                             │
│ • Dimensions: 800x600                                      │
│ • Submitted: Dec 15, 2024 2:30 PM                         │
│ • Submitter: John Doe                                      │
│                                                             │
│ **Association:**                                           │
│ • Saint: St. Patrick                                       │
│ • Location: St. Patrick's Cathedral, New York, NY         │
│ • Year: 2024                                              │
│ • Milestone: Annual Celebration                           │
│ • Notes: Special commemorative sticker for 2024           │
│                                                             │
│ [⬅️ Previous] [Next ➡️] [❌ Close]                          │
└─────────────────────────────────────────────────────────────┘
```

## Mockup 4: Bulk Approval Actions

### Bulk Selection Interface
```
┌─────────────────────────────────────────────────────────────┐
│                🔄 Bulk Approval Actions                     │
├─────────────────────────────────────────────────────────────┤
│ ☑️ **Select All** (12 pending stickers)                    │
│                                                             │
│ Selected: 5 items                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑️ st-patrick-2024.png                                 │ │
│ │ ☑️ st-nicholas-2024.jpg                                │ │
│ │ ☑️ st-francis-2024.png                                 │ │
│ │ ☐ st-mary-2024.png                                     │ │
│ │ ☐ st-joseph-2024.jpg                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ **Bulk Actions:**                                           │
│ [✅ Approve Selected] [❌ Reject Selected] [💬 Add Comment] │
│                                                             │
│ **Comment for bulk action:**                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Approved as part of December 2024 batch upload...       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                [❌ Cancel]          [✅ Apply Action]       │
└─────────────────────────────────────────────────────────────┘
```

## Design Notes

### Color Scheme
- Primary: Green (#15803d, #166534)
- Background: Light green (#f0fdf4)
- Borders: Green tint (#d1fae5)
- Text: Dark green (#15803d)

### Icons Used
- 📁 Folder (upload zone)
- 📎 Paperclip (file selection)
- 🗑️ Trash (remove/delete)
- 🔍 Magnifying glass (search)
- ✅ Checkmark (approve)
- ❌ X mark (reject/cancel)
- 👁️ Eye (preview)
- 💬 Speech bubble (comments)
- ⬅️ ➡️ Arrows (navigation)
- 🔄 Refresh (process/retry)

### Responsive Behavior
- Desktop: Full layout with side-by-side elements
- Tablet: Stacked layout with adjusted spacing
- Mobile: Single column with collapsible sections

### Accessibility Features
- High contrast mode support
- Keyboard navigation (Tab, Enter, Space)
- Screen reader labels
- Focus indicators
- Error announcements

## Next Steps
Please review these mockups and let me know:
1. Which design elements you like/dislike
2. Any missing functionality you'd like to see
3. Changes to the workflow or layout
4. Specific branding or styling preferences