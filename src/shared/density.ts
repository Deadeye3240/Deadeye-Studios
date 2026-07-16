export const DENSITY_MODES = ['compact', 'comfortable'] as const

export type DensityMode = (typeof DENSITY_MODES)[number]

export const DEFAULT_DENSITY_MODE: DensityMode = 'compact'

export const DEFAULT_UI_SCALE = 1

export const UI_SCALE_OPTIONS = [
  { value: 0.9, label: '90%' },
  { value: 0.95, label: '95%' },
  { value: 1, label: '100%' },
  { value: 1.05, label: '105%' },
  { value: 1.1, label: '110%' },
  { value: 1.15, label: '115%' },
] as const

export const DENSITY_MODE_OPTIONS = [
  { value: 'compact' as const, label: 'Compact (Professional)' },
  { value: 'comfortable' as const, label: 'Comfortable' },
] as const

/** Layout tokens applied to :root for each density preset. */
export const DENSITY_LAYOUT_VARS: Record<DensityMode, Readonly<Record<string, string>>> = {
  compact: {
    '--deadeye-menubar-height': '28px',
    '--deadeye-header-height': '32px',
    '--deadeye-status-height': '22px',
    '--deadeye-tab-height': '30px',
    '--deadeye-activity-width': '40px',
    '--deadeye-sidebar-width': '240px',
    '--deadeye-activity-item-size': '32px',
    '--deadeye-breadcrumb-height': '24px',
    '--deadeye-text-xs': '9px',
    '--deadeye-text-sm': '10px',
    '--deadeye-text-base': '11px',
    '--deadeye-text-md': '12px',
    '--deadeye-text-lg': '14px',
    '--deadeye-text-xl': '18px',
    '--deadeye-space-1': '3px',
    '--deadeye-space-2': '4px',
    '--deadeye-space-3': '6px',
    '--deadeye-space-4': '8px',
    '--deadeye-space-5': '12px',
    '--deadeye-space-6': '16px',
    '--deadeye-panel-padding-x': '8px',
    '--deadeye-panel-padding-y': '6px',
    '--deadeye-button-height': '24px',
    '--deadeye-icon-size-sm': '18px',
    '--deadeye-icon-size-md': '20px',
  },
  comfortable: {
    '--deadeye-menubar-height': '30px',
    '--deadeye-header-height': '38px',
    '--deadeye-status-height': '26px',
    '--deadeye-tab-height': '38px',
    '--deadeye-activity-width': '48px',
    '--deadeye-sidebar-width': '268px',
    '--deadeye-activity-item-size': '40px',
    '--deadeye-breadcrumb-height': '28px',
    '--deadeye-text-xs': '10px',
    '--deadeye-text-sm': '11px',
    '--deadeye-text-base': '12px',
    '--deadeye-text-md': '13px',
    '--deadeye-text-lg': '16px',
    '--deadeye-text-xl': '22px',
    '--deadeye-space-1': '4px',
    '--deadeye-space-2': '6px',
    '--deadeye-space-3': '8px',
    '--deadeye-space-4': '12px',
    '--deadeye-space-5': '16px',
    '--deadeye-space-6': '24px',
    '--deadeye-panel-padding-x': '10px',
    '--deadeye-panel-padding-y': '8px',
    '--deadeye-button-height': '28px',
    '--deadeye-icon-size-sm': '20px',
    '--deadeye-icon-size-md': '22px',
  },
}

export function normalizeDensityMode(value: string | undefined): DensityMode {
  return value === 'comfortable' ? 'comfortable' : 'compact'
}

export function normalizeUiScale(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) {
    return DEFAULT_UI_SCALE
  }

  return Math.min(1.5, Math.max(0.75, value))
}

export function getTitleBarHeightForDensity(mode: DensityMode): number {
  return mode === 'compact' ? 32 : 38
}

export const MENU_BAR_HEIGHT = 28

export function getTitleBarOverlayHeight(mode: DensityMode): number {
  return getTitleBarHeightForDensity(mode) + MENU_BAR_HEIGHT
}

export function computeEditorLineHeight(fontSize: number): number {
  if (fontSize <= 12) {
    return 18
  }

  if (fontSize <= 13) {
    return 20
  }

  return 22
}

export function getUiScaleSelectOptions(): Array<{ value: string; label: string }> {
  return UI_SCALE_OPTIONS.map((option) => ({
    value: String(option.value),
    label: option.label,
  }))
}

export function getDensityModeSelectOptions(): Array<{ value: string; label: string }> {
  return DENSITY_MODE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }))
}
