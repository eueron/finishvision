# FinishVision — Phase 3: File System Delivery

**Status:** COMPLETE  
**Date:** March 7, 2026  
**Phase:** 3 of 8 — File System

---

## 1. What Was Built

Phase 3 implements the complete blueprint file management system: PDF upload with progress tracking, asynchronous PDF processing (page extraction, image rendering, thumbnail generation), sheet indexing with metadata, and a full frontend UI for managing blueprints and viewing sheets.

---

## 2. Database Changes

Two new models added to Prisma schema with migration `add_blueprints_sheets`:

### New Enums

| Enum | Values |
|---|---|
| `FileStatus` | UPLOADING, PROCESSING, READY, ERROR |
| `SheetType` | FLOOR_PLAN, DOOR_SCHEDULE, WINDOW_SCHEDULE, ELEVATION, DETAIL, COVER, OTHER |

### New Tables

**`blueprints`** — Represents an uploaded PDF file.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| projectId | UUID | FK to projects |
| uploadedById | UUID | User who uploaded |
| originalName | String | Original filename |
| storagePath | String | Path in storage |
| fileSize | Int | File size in bytes |
| mimeType | String | MIME type |
| status | FileStatus | Processing status |
| pageCount | Int | Number of PDF pages |
| errorMessage | String? | Error details if failed |

**`sheets`** — Represents a single page extracted from a blueprint PDF.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| blueprintId | UUID | FK to blueprints |
| pageNumber | Int | Page number in PDF |
| sheetName | String? | User-editable name |
| sheetType | SheetType | Classification |
| thumbnailPath | String? | Thumbnail image path |
| imagePath | String? | Full-res image path |
| width, height | Int? | Image dimensions |
| dpi | Int? | Rendering DPI |
| scaleText | String? | Scale notation |
| scaleFactor | Float? | Numeric scale factor |
| ocrText | Text? | Extracted OCR text |

---

## 3. Backend Modules Added

### Blueprint Module

| Component | Purpose |
|---|---|
| `BlueprintController` | REST endpoints for upload, list, get, delete |
| `BlueprintService` | Business logic with multi-tenant security |
| `PdfProcessorService` | Async PDF processing pipeline |

### Sheet Module

| Component | Purpose |
|---|---|
| `SheetController` | REST endpoints for sheet CRUD |
| `SheetService` | Business logic with ownership verification |

### Storage Service (Rewritten)

The storage service was rewritten with a **local filesystem fallback** for development. In development mode, files are stored under `/tmp/fv-storage/` with the same path structure that would be used in S3. A `StorageController` was added to serve files from local storage during development.

### New API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/projects/:projectId/blueprints` | List blueprints |
| GET | `/projects/:projectId/blueprints/:id` | Get blueprint with sheets |
| POST | `/projects/:projectId/blueprints/upload` | Upload PDF (multipart) |
| DELETE | `/projects/:projectId/blueprints/:id` | Soft delete blueprint |
| GET | `/projects/:projectId/blueprints/:id/sheets/:sheetId/image` | Get sheet image URL |
| GET | `/sheets/blueprint/:blueprintId` | List sheets by blueprint |
| GET | `/sheets/:id` | Get sheet detail |
| PATCH | `/sheets/:id` | Update sheet metadata |
| PATCH | `/sheets/:id/scale` | Update sheet scale |
| GET | `/storage/files/*` | Serve files from local storage |

**Total new endpoints: 10**

### PDF Processing Pipeline

The `PdfProcessorService` implements the following pipeline:

1. **Status update** — Set blueprint status to PROCESSING
2. **PDF parsing** — Load PDF with `pdf-lib`, extract page count
3. **Image generation** — Use `pdftoppm` (poppler-utils) to render each page at 150 DPI
4. **Thumbnail generation** — Use ImageMagick `convert` to create 300px-wide thumbnails
5. **Storage upload** — Store images in structured paths: `companies/{id}/projects/{id}/blueprints/sheets/page-{n}.png`
6. **Sheet creation** — Create a Sheet record for each page with dimensions and paths
7. **Status finalization** — Set blueprint status to READY (or ERROR with message)

Processing runs asynchronously after upload returns, so the user gets an immediate response.

---

## 4. Frontend Pages Added

### Blueprints List Page (`/dashboard/projects/[id]/blueprints`)

Features:
- Drag-and-drop upload zone with visual feedback
- Upload progress bar with percentage
- File type validation (PDF only) and size limit (100MB)
- Blueprint list with status badges (Uploading, Processing, Ready, Error)
- Auto-polling every 5 seconds to update processing status
- File size formatting, page count, sheet count display
- Delete functionality with confirmation

### Blueprint Detail Page (`/dashboard/projects/[id]/blueprints/[blueprintId]`)

Features:
- Sheet grid with thumbnail previews
- Page number overlay on each thumbnail
- Sheet type badge with color coding (Floor Plan = blue, Door Schedule = amber, etc.)
- Inline editing of sheet name and type
- Scale information display
- Responsive grid layout (1-4 columns)

### Project Detail Page Updates

- Added "Blueprints" button in the project header for quick navigation

---

## 5. File Structure Added

```
apps/backend/src/
├── modules/
│   ├── blueprint/
│   │   ├── blueprint.controller.ts
│   │   ├── blueprint.service.ts
│   │   ├── blueprint.module.ts
│   │   ├── pdf-processor.service.ts
│   │   └── dto/index.ts
│   └── sheet/
│       ├── sheet.controller.ts
│       ├── sheet.service.ts
│       ├── sheet.module.ts
│       └── dto/index.ts
├── storage/
│   ├── storage.service.ts          (rewritten with local fallback)
│   ├── storage.controller.ts       (new — serves local files)
│   └── storage.module.ts           (updated)
└── prisma/
    └── migrations/
        └── add_blueprints_sheets/

apps/frontend/src/
├── app/dashboard/projects/[id]/
│   ├── blueprints/
│   │   ├── page.tsx                (blueprint list + upload)
│   │   └── [blueprintId]/
│   │       └── page.tsx            (sheet grid + editing)
│   └── page.tsx                    (updated with Blueprints button)
└── lib/api.ts                      (updated with blueprint/sheet endpoints)
```

---

## 6. Verified Test Results

All 8 API test scenarios passed:

| Test | Result |
|---|---|
| Upload PDF blueprint | PASS — Created with UPLOADING status |
| Async processing | PASS — Status changed to READY after 5s |
| Get blueprint with sheets | PASS — 3 sheets with images and thumbnails |
| List all blueprints | PASS — 1 blueprint, 3 sheets |
| Get sheet details | PASS — Sheet 1 with correct metadata |
| Update sheet metadata | PASS — Renamed to "A1.01 - Floor Plan Level 1" (FLOOR_PLAN) |
| Update sheet scale | PASS — Scale set to 1/4" = 1'-0" (factor: 48) |
| List sheets by blueprint | PASS — 3 sheets in correct order |

Frontend build: **PASS** — 10 pages compile successfully including 2 new blueprint routes.

---

## 7. What Comes Next — Phase 4

Phase 4 (Plan Viewer) will build upon this by adding:

- Interactive blueprint viewer with zoom and pan
- Scale calibration tool
- Sheet navigation sidebar
- Measurement overlay capabilities

---

**PHASE 3 — FILE SYSTEM: COMPLETE**
