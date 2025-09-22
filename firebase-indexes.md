# Firebase Firestore Indexes

This document contains the required Firestore indexes for the application.

## Required Composite Indexes

### Departments Collection

**Index for `getActiveOnly()` query:**
- Collection: `departments`
- Fields:
  - `isActive` (Ascending)
  - `name` (Ascending)
  - `__name__` (Ascending) - automatically added by Firebase

**Firebase Console URL:**
```
https://console.firebase.google.com/v1/r/project/superapp-cds/firestore/indexes?create_composite=ClBwcm9qZWN0cy9zdXBlcmFwcC1jZHMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2RlcGFydG1lbnRzL2luZGV4ZXMvXxABGgwKCGlzQWN0aXZlEAEaCAoEbmFtZRABGgwKCF9fbmFtZV9fEAE
```

**Manual Creation Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`superapp-cds`)
3. Navigate to Firestore Database > Indexes
4. Click "Create Index"
5. Set Collection ID: `departments`
6. Add fields:
   - Field: `isActive`, Order: Ascending
   - Field: `name`, Order: Ascending
7. Click "Create"

## Current Workaround

The application currently uses client-side filtering and sorting to avoid the composite index requirement:

```typescript
async getActiveOnly(): Promise<Department[]> {
  // Fetch all departments and filter/sort client-side
  const querySnapshot = await getDocs(
    collection(db, COLLECTIONS.DEPARTMENTS).withConverter(departmentConverter)
  );
  const allDepartments = querySnapshot.docs.map(doc => doc.data());
  
  // Filter active departments and sort by name
  return allDepartments
    .filter(dept => dept.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

This approach:
- ✅ Works without requiring manual index creation
- ✅ Suitable for small to medium datasets
- ⚠️ Less efficient for large datasets (fetches all departments)
- ⚠️ Uses more bandwidth and client-side processing

## Recommendation

For production use with many departments, create the composite index using the URL above or manual steps, then revert to the server-side query:

```typescript
async getActiveOnly(): Promise<Department[]> {
  const q = query(
    collection(db, COLLECTIONS.DEPARTMENTS).withConverter(departmentConverter),
    where('isActive', '==', true),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}
```
