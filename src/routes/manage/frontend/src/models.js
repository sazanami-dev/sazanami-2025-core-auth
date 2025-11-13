import { formatBoolean, formatDateTime } from './utils/format.js';

export const PAGE_SIZE = 20;

export const modelConfigs = [
  {
    key: 'user',
    label: 'Users',
    description: 'Basic user records',
    path: '/manage/api/user',
    primaryKey: 'id',
    allowManualPrimaryKey: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'isInitialized', label: 'Initialized', formatter: formatBoolean },
    ],
    fields: [
      { key: 'id', label: 'ID', type: 'text', readOnly: true },
      { key: 'displayName', label: 'Display Name', type: 'text' },
      { key: 'isInitialized', label: 'Initialized', type: 'checkbox' },
    ],
  },
  {
    key: 'registrationCode',
    label: 'Registration Codes',
    description: 'Pending registrations',
    path: '/manage/api/regCode',
    primaryKey: 'code',
    allowManualPrimaryKey: true,
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'userId', label: 'User ID' },
      { key: 'createdAt', label: 'Created', formatter: formatDateTime },
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', readOnly: true },
      { key: 'userId', label: 'User ID', type: 'text' },
      { key: 'createdAt', label: 'Created', type: 'text', readOnly: true },
    ],
  },
  {
    key: 'session',
    label: 'Sessions',
    description: 'Active login sessions',
    path: '/manage/api/session',
    primaryKey: 'id',
    allowManualPrimaryKey: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'userId', label: 'User ID' },
      { key: 'createdAt', label: 'Created', formatter: formatDateTime },
    ],
    fields: [
      { key: 'id', label: 'ID', type: 'text', readOnly: true },
      { key: 'userId', label: 'User ID', type: 'text' },
      { key: 'createdAt', label: 'Created', type: 'text', readOnly: true },
    ],
  },
  {
    key: 'pendingRedirect',
    label: 'Pending Redirects',
    description: 'Unactioned redirects',
    path: '/manage/api/pending-redirect',
    primaryKey: 'id',
    allowManualPrimaryKey: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'redirectUrl', label: 'Redirect URL' },
      { key: 'used', label: 'Used', formatter: formatBoolean },
      { key: 'expiresAt', label: 'Expires', formatter: formatDateTime },
      { key: 'createdAt', label: 'Created', formatter: formatDateTime },
    ],
    fields: [
      { key: 'id', label: 'ID', type: 'text', readOnly: true },
      { key: 'redirectUrl', label: 'Redirect URL', type: 'text' },
      { key: 'postbackUrl', label: 'Postback URL', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'used', label: 'Used', type: 'checkbox' },
      { key: 'expiresAt', label: 'Expires', type: 'datetime' },
      { key: 'sessionId', label: 'Session ID', type: 'text' },
      { key: 'createdAt', label: 'Created', type: 'text', readOnly: true },
    ],
  },
];

export function findModelConfig(key) {
  return modelConfigs.find((config) => config.key === key);
}
