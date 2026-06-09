# Implementation Plan - Split JAMB & O'Level Result Slip Uploads

This plan outlines separating the result slip uploads on the Academic Locker & Verification page so that JAMB result slips and O'Level (WAEC/NECO/GCE/NABTEB) result slips have their own dedicated upload inputs. This prevents conflicts during mock AI OCR extraction and ensures uploads are stored and categorized correctly in the backend.

---

## User Review Required

> [!NOTE]
> **Database Structure**: We will store the result slips directly in their respective locations (`user.jambResultSlip` and `user.olevelSittings[x].resultSlip`) so they are properly segmented.
>
> **Locker Compatibility**: The existing `GET /api/users/documents` and `DELETE /api/users/documents/:id` endpoints will be adapted to handle these inline result slips as well, so that the university application page continues to see all uploaded files.

---

## Open Questions

None at this time. All requirements are clear and follow established codebase patterns.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [userModel.js](file:///c:/Users/makin/Desktop/intellipath/server/src/models/userModel.js)
- Add `jambResultSlip` schema definition to the user model:
  ```js
  jambResultSlip: {
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }
  ```
- Add `resultSlip` schema definition to `olevelSittings` array elements:
  ```js
  olevelSittings: [
    {
      sittingNumber: Number,
      // ... existing fields ...
      resultSlip: {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
      subjects: [...]
    }
  ]
  ```

---

### Backend Routes & Controllers

#### [MODIFY] [validationMiddleware.js](file:///c:/Users/makin/Desktop/intellipath/server/src/middleware/validationMiddleware.js)
- Update `profileUpdateSchema.body` to support `jambResultSlip` optional object schema validation:
  ```js
  jambResultSlip: z.any().optional(),
  ```

#### [MODIFY] [userRoutes.js](file:///c:/Users/makin/Desktop/intellipath/server/src/routes/userRoutes.js)
- **`POST /api/users/upload-document`**:
  - Read query params `type` (`"jamb"` | `"olevel"`) and `sittingNumber` (1 | 2).
  - Save the uploaded file details directly to `user.jambResultSlip` or `user.olevelSittings[x].resultSlip` instead of the generic `user.uploadedDocuments` array (defaulting to the array if no type is specified).
- **`POST /api/users/ocr-extract`**:
  - Read query params `type` (`"jamb"` | `"olevel"`) and `sittingNumber`.
  - Force the OCR logic to return JAMB mock data if `type === "jamb"`.
  - If `type === "olevel"`, perform the filename/text search for WAEC/NECO/NABTEB/GCE, and default to WAEC if none match. This prevents any JAMB mock data from polluting the O'Level sittings.
- **`GET /api/users/documents`**:
  - Return a consolidated array of all user documents, merging `uploadedDocuments`, `jambResultSlip` (if exists), and all sittings' `resultSlip` (if exists) so the application page's document listing is preserved.
- **`DELETE /api/users/documents/:id`**:
  - Support deleting documents from `uploadedDocuments`, `jambResultSlip`, or any sitting's `resultSlip` based on matching `_id`.
- **`PUT /api/users/update-profile`**:
  - Add support for updating `jambResultSlip` directly from the payload.

---

### Frontend Services

#### [MODIFY] [api.ts](file:///c:/Users/makin/Desktop/intellipath/frontend/src/services/api.ts)
- Update `uploadDocument` signature to `uploadDocument(file: File, type?: string, sittingNumber?: number)` and append these parameters as query arguments to `/users/upload-document`.
- Update `ocrExtractResult` signature to `ocrExtractResult(file: File, type?: string, sittingNumber?: number)` and append query parameters to `/users/ocr-extract`. Return the complete response payload so the client can read all parsed fields.
- Update `getProfile` and `updateProfile` mapping to support `jambResultSlip`.

---

### Frontend Pages

#### [MODIFY] [documents.tsx](file:///c:/Users/makin/Desktop/intellipath/frontend/src/routes/documents.tsx)
- Remove the "Upload Locker" tab header toggle so the Entry & Verification form is always shown.
- Add an inline "Upload JAMB Slip" button in the JAMB UTME Record header. Display the uploaded file name with an (X) button to clear it if it exists.
- Add an inline "Upload Slip" button next to each active O'Level sitting. Display the sitting's uploaded file name with an (X) button to clear it if it exists.
- Implement `handleSingleUpload(file, type, sittingNumber)` to run the type-specific upload and OCR pre-population, directly target the selected sitting index, and avoid cross-state collision.

---

## Verification Plan

### Automated Tests
- Run `npm run build` in the `frontend` directory to verify compile safety.

### Manual Verification
1. Log in as a student, navigate to `Documents`.
2. Observe that the "Upload Locker" tab switcher button is gone.
3. In the JAMB UTME Record section, upload `jambresult1.jpg`.
   - Verify the score is populated to 362, Use of English is 98, and other fields (Date of birth, candidate name, etc.) are pre-filled.
   - Verify the filename shows up with a clear (X) button.
4. In the O'Level sitting #1 section, upload `gceimage.png`.
   - Verify it populates sitting #1 with private candidate GCE details, without modifying the JAMB UTME data.
5. Click Save and confirm changes are correctly saved to the profile.
