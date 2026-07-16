import { Modal } from '../components/modal'

export interface ConfirmDialogOptions {
  readonly title?: string
  readonly message: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly variant?: 'default' | 'danger'
}

export interface PromptDialogOptions {
  readonly title: string
  readonly message?: string
  readonly defaultValue?: string
  readonly placeholder?: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
}

export interface AlertDialogOptions {
  readonly title?: string
  readonly message: string
  readonly okLabel?: string
}

export class DialogService {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      let modal: Modal | null = null

      const close = (result: boolean): void => {
        modal?.dispose()
        resolve(result)
      }

      modal = new Modal(this.container, {
        title: options.title ?? 'Confirm',
        message: options.message,
        actions: [
          {
            label: options.cancelLabel ?? 'Cancel',
            variant: 'ghost',
            onClick: () => close(false),
          },
          {
            label: options.confirmLabel ?? 'Confirm',
            variant: options.variant === 'danger' ? 'danger' : 'primary',
            onClick: () => close(true),
          },
        ],
        onClose: () => close(false),
      })
    })
  }

  prompt(options: PromptDialogOptions): Promise<string | null> {
    return new Promise((resolve) => {
      let modal: Modal | null = null

      const close = (result: string | null): void => {
        modal?.dispose()
        resolve(result)
      }

      modal = new Modal(this.container, {
        title: options.title,
        message: options.message,
        input: {
          value: options.defaultValue,
          placeholder: options.placeholder,
        },
        actions: [
          {
            label: options.cancelLabel ?? 'Cancel',
            variant: 'ghost',
            onClick: () => close(null),
          },
          {
            label: options.confirmLabel ?? 'OK',
            variant: 'primary',
            onClick: () => close(modal?.getInputValue() ?? null),
          },
        ],
        onClose: () => close(null),
      })
    })
  }

  alert(options: AlertDialogOptions): Promise<void> {
    return new Promise((resolve) => {
      let modal: Modal | null = null

      const close = (): void => {
        modal?.dispose()
        resolve()
      }

      modal = new Modal(this.container, {
        title: options.title ?? 'Deadeye Studio',
        message: options.message,
        actions: [
          {
            label: options.okLabel ?? 'OK',
            variant: 'primary',
            onClick: close,
          },
        ],
        onClose: close,
      })
    })
  }
}

let dialogService: DialogService | null = null

export function initDialogService(container: HTMLElement): DialogService {
  dialogService = new DialogService(container)
  return dialogService
}

export function getDialogService(): DialogService {
  if (!dialogService) {
    throw new Error('Dialog service is not initialized')
  }

  return dialogService
}
