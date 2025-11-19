# Subject Color Import/Export Compatibility

This document describes how subject colors are handled during configuration import and export operations.

## Overview

Subject colors are fully supported in the import/export workflow. The system ensures backward compatibility with configurations that don't have colors while preserving custom colors when they exist.

## Export Behavior

When exporting configuration data (via the "Export JSON" button):

- **All subject colors are included** in the exported JSON file
- Colors are stored as hexadecimal color codes (e.g., `"#F4D1AE"`)
- The exported file maintains the complete state including colors

### Example Export

```json
{
  "config": {
    "subjects": [
      {
        "id": "subject-math101",
        "name": "Foundations of Algebra",
        "code": "MATH-101",
        "color": "#F4D1AE"
      },
      {
        "id": "subject-phys210",
        "name": "Classical Mechanics",
        "code": "PHYS-210",
        "color": "#B8E6B8"
      }
    ]
  }
}
```

## Import Behavior

The system handles three scenarios when importing configuration data:

### 1. Importing Configuration WITH Colors

When importing a configuration file that includes color values:

- **Colors are preserved exactly as specified** in the import file
- No default colors are assigned
- Custom colors remain unchanged

**Example:**
```json
{
  "subjects": [
    {
      "id": "subject-1",
      "code": "CS-101",
      "color": "#FF5733"  // Custom color is preserved
    }
  ]
}
```

### 2. Importing Configuration WITHOUT Colors

When importing a configuration file that doesn't include color values:

- **Default colors are automatically assigned** from the predefined palette
- Colors are assigned sequentially based on subject order
- The palette cycles if there are more than 6 subjects

**Default Color Palette:**
1. `#F4D1AE` - Light peach
2. `#B8E6B8` - Light green
3. `#B8D8E8` - Light blue
4. `#D8B8E8` - Light purple
5. `#C8C8C8` - Light gray
6. `#F4C8A0` - Light orange

**Example:**
```json
{
  "subjects": [
    {
      "id": "subject-1",
      "code": "ENG-101"
      // No color specified - will get #F4D1AE
    },
    {
      "id": "subject-2",
      "code": "HIST-101"
      // No color specified - will get #B8E6B8
    }
  ]
}
```

### 3. Importing Configuration with MIXED Colors

When importing a configuration where some subjects have colors and others don't:

- **Existing colors are preserved**
- **Missing colors are assigned defaults** based on the subject's index
- Each subject is evaluated independently

**Example:**
```json
{
  "subjects": [
    {
      "id": "subject-1",
      "code": "MATH-101",
      "color": "#FF0000"  // Custom color preserved
    },
    {
      "id": "subject-2",
      "code": "PHYS-210"
      // No color - will get default for index 1: #B8E6B8
    },
    {
      "id": "subject-3",
      "code": "CHEM-101",
      "color": "#00FF00"  // Custom color preserved
    },
    {
      "id": "subject-4",
      "code": "BIO-101"
      // No color - will get default for index 3: #D8B8E8
    }
  ]
}
```

## Backward Compatibility

The color feature is fully backward compatible:

- **Old configuration files without colors** will work seamlessly
- Default colors are assigned automatically on import
- No manual intervention required
- Existing workflows are not disrupted

## Testing

The import/export color compatibility is verified through comprehensive unit tests:

- ✅ Colors are included in exports
- ✅ Colors are preserved on import when present
- ✅ Default colors are assigned when missing
- ✅ Color palette cycles for many subjects
- ✅ Mixed configurations (some with/without colors) work correctly
- ✅ Round-trip export/import preserves colors

See `frontend/src/__tests__/colorImportExport.test.ts` for test implementation.

## Sample Files

Two sample configuration files are provided:

1. **`samples/sample-config.json`** - Configuration without colors (demonstrates default assignment)
2. **`samples/sample-config-with-colors.json`** - Configuration with colors (demonstrates preservation)

## Implementation Details

The color assignment logic is implemented in:

- **Store:** `frontend/src/store/schedulerStore.ts` - Calls `ensureSubjectColors` on config update
- **Utilities:** `frontend/src/utils/colorUtils.ts` - Contains `ensureSubjectColors` function
- **Import:** `frontend/src/components/config/ConfigImporter.tsx` - Handles file import
- **Export:** `frontend/src/components/config/ConfigExporter.tsx` - Handles file export

The `ensureSubjectColors` function is automatically called whenever configuration is updated through the store, ensuring colors are always assigned when needed.
