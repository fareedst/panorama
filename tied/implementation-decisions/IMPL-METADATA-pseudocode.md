# IMPL-METADATA essence pseudocode

// [IMPL-METADATA] [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] [REQ-CONFIG_DRIVEN_UI]: Export Next.js Metadata from root layout driven by site config

## ExportMetadataConstant

// [IMPL-METADATA] [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] [REQ-CONFIG_DRIVEN_UI]: how — call getSiteConfig once at module load; export metadata constant with title and description for Next.js Metadata API.

```
IMPL-METADATA_ExportMetadataConstant():
  INPUT: config/site.yaml via getSiteConfig()
  OUTPUT: exported metadata: Metadata object
  DATA: siteConfig.metadata.title, siteConfig.metadata.description
  PRE: layout module loads; getSiteConfig returns site metadata
  POST: exported metadata contains title and description from site config
  EFFECTS: IO
  TERMINATION: total
  DATA siteConfig = getSiteConfig()
  EXPORT metadata = { title: siteConfig.metadata.title, description: siteConfig.metadata.description }
```

## MetadataTestContract

// [IMPL-METADATA] [ARCH-NEXTJS_FRAMEWORK] [REQ-METADATA] [REQ-CONFIG_DRIVEN_UI]: how — tests assert exported metadata matches live site config values and required string fields exist.

```
IMPL-METADATA_MetadataTestContract():
  INPUT: imported metadata from layout module, getSiteConfig()
  OUTPUT: passing assertions
  DATA: site.metadata.title, site.metadata.description
  PRE: metadata export and getSiteConfig available in test harness
  POST: metadata title/description match site config; both are strings
  EFFECTS: pure
  TERMINATION: total
  ASSERT metadata defined
  ASSERT metadata.title equals site.metadata.title
  ASSERT metadata.description equals site.metadata.description
  ASSERT typeof title and description are string
```
