// The fixed sequence of construction stages every project moves through,
// from site preparation to handover. Same list for every project — this
// is a schema-level constant, not seeded project data.
export const CONSTRUCTION_STAGES = [
  "Foundation",
  "Basement Construction",
  "Plinth Level",
  "Ground Floor Construction",
  "First Floor Construction",
  "Second Floor Construction",
  "Third Floor Construction",
  "Staircase",
  "Lift Shaft",
  "Roof Slab",
  "Terrace Waterproofing",
  "Internal Plastering",
  "External Plastering",
  "Electrical Works",
  "Plumbing Works",
];

export const CURRENT_ACTIVITY_OPTIONS = [
  "Formwork / Shuttering",
  "Reinforcement (Steel Fixing)",
  "Concreting / Casting",
  "Curing",
  "Masonry / Brickwork",
  "Waterproofing Treatment",
  "Fixing & Installation",
  "Inspection",
  "Rework / Rectification",
  "Other",
];

export const QUALITY_INSPECTION_STATUSES = ["Pending", "Passed", "Failed", "Needs Rework"];
export const STAGE_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];

export const QUALITY_CHECKLIST_ITEMS = [
  "Work matches approved drawing / plan",
  "Materials used match specification",
  "Dimensions and alignment verified",
  "Reinforcement / formwork checked before casting",
  "Curing period completed as required",
  "Site cleaned and safe after work",
];
