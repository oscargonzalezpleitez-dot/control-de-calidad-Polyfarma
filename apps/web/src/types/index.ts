// ============================================================
// PharmaQMS - Tipos TypeScript
// ============================================================

export type UserRole = 'ADMIN' | 'QUALITY' | 'PRODUCTION' | 'DEVELOPMENT' |
  'MICROBIOLOGY' | 'QUALITY_CONTROL' | 'REGULATORY_AFFAIRS' | 'AUDITOR' | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_ACTIVATION';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
  employeeId?: string;
  mfaEnabled: boolean;
  signatureEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  permissions: UserPermission[];
}

export interface UserPermission {
  id: string;
  module: string;
  action: string;
  granted: boolean;
}

export type FormatStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'OBSOLETE' | 'SUPERSEDED';
export type FormatType = 'FORM' | 'CHECKLIST' | 'LOG' | 'PROTOCOL' | 'REPORT_TEMPLATE' | 'CERTIFICATE' | 'SOP' | 'BATCH_RECORD';
export type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'DATETIME' | 'TIME' |
  'SELECT' | 'MULTISELECT' | 'CHECKBOX' | 'RADIO' | 'SIGNATURE' | 'FILE_UPLOAD' |
  'IMAGE' | 'CALCULATED' | 'LABEL' | 'SEPARATOR' | 'TABLE';

export interface FormatField {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  order: number;
  isRequired: boolean;
  isReadOnly: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  unit?: string;
  decimalPlaces?: number;
  options?: string[];
  formula?: string;
  visibilityRule?: any;
  section?: FormatSection;
}

export interface FormatSection {
  id: string;
  name: string;
  description?: string;
  order: number;
  isRepeatable: boolean;
  maxRepeat?: number;
  fields: FormatField[];
}

export interface Format {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: FormatType;
  status: FormatStatus;
  version: string;
  department?: string;
  effectiveDate?: string;
  retentionPeriod?: number;
  sections: FormatSection[];
  fields: FormatField[];
  approvals: FormatApproval[];
  createdBy: Partial<User>;
  createdAt: string;
}

export interface FormatApproval {
  id: string;
  formatId: string;
  userId: string;
  role: 'ELABORATED_BY' | 'REVIEWED_BY' | 'APPROVED_BY' | 'VERIFIED_BY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  signedAt?: string;
  order: number;
  user: Partial<User>;
}

export type RecordStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'UNDER_REVIEW' |
  'APPROVED' | 'REJECTED' | 'CANCELLED' | 'INVALIDATED' | 'SUPERSEDED';

export interface RecordFieldValue {
  id: string;
  recordId: string;
  fieldId: string;
  sectionIndex: number;
  value?: string;
  valueNumeric?: number;
  valueDate?: string;
  valueJson?: any;
  enteredAt: string;
  enteredBy: Partial<User>;
  field: FormatField;
}

export interface Record {
  id: string;
  formatId: string;
  code: string;
  status: RecordStatus;
  title?: string;
  batchNumber?: string;
  productName?: string;
  startDate?: string;
  endDate?: string;
  cancelReason?: string;
  invalidReason?: string;
  format: Format;
  fieldValues: RecordFieldValue[];
  signatures: ElectronicSignature[];
  attachments: Attachment[];
  createdBy: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface ElectronicSignature {
  id: string;
  userId: string;
  type: string;
  purpose: string;
  meaning: string;
  comments?: string;
  recordId?: string;
  signedAt: string;
  ipAddress: string;
  dataHash: string;
  signatureHash: string;
  isRevoked: boolean;
  user: Partial<User>;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  changeReason?: string;
  ipAddress: string;
  integrityHash: string;
  timestamp: string;
  user?: Partial<User>;
}

export interface Attachment {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  type: string;
  checksum: string;
  description?: string;
  uploadedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
