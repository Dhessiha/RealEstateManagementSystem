// Enum-style option lists used by forms, filters and status pills.
// These are configuration values (schema-level), not seeded/demo records —
// every list below (projects, units, tasks, workers, materials) starts
// empty and is populated only by what the user enters in the app.

export const PROJECT_TYPES = ["Residential", "Commercial", "Villa", "Township"];
export const PROJECT_STATUSES = ["Planning", "In Progress", "Nearing Completion", "Completed"];
export const MATERIAL_RESPONSIBILITY = ["Company", "Client", "Shared"];

export const UNIT_STATUSES = ["Available", "Booked", "Sold", "On Hold"];

export const TASK_STAGES = [
  "Foundation",
  "Structure",
  "Masonry",
  "Electrical",
  "Plumbing",
  "Finishing",
  "Handover",
];
export const TASK_STATUSES = ["Not Started", "In Progress", "Delayed", "Completed"];

export const WORKER_TYPES = ["Permanent", "Temporary", "Contractor"];
export const AVAILABILITY_STATUSES = ["Available", "On Site", "On Leave", "Unavailable"];

export const MATERIAL_CATEGORIES = [
  "Structural",
  "Electrical",
  "Plumbing",
  "Finishing",
  "Civil",
  "Other",
];
export const SUPPLIER_TYPES = ["Company", "Client", "Vendor"];
export const UOM_UNITS = ["units", "bags", "kg", "tons", "sqft", "cum", "meters", "liters"];

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Half Day", "On Leave"];

export const LOG_CATEGORIES = [
  "Progress Update",
  "Material Movement",
  "Site Observation",
  "Safety",
  "Issue",
];

export const DOCUMENT_CATEGORIES = ["Plan", "Approval", "Contract", "Customer Document", "Other"];

export const ISSUE_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
export const ISSUE_STATUSES = ["Open", "In Review", "Resolved", "Closed"];

export const PAYMENT_MODES = ["Bank Transfer", "Cheque", "Cash", "UPI", "Card"];
