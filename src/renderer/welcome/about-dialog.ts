import { APP_NAME, APP_TAGLINE, APP_VERSION } from '../../shared/version'
import { Modal } from '../components/modal'

export function showAboutDialog(container: HTMLElement): void {
  const modal = new Modal(container, {
    title: `About ${APP_NAME}`,
    wide: true,
    message: `${APP_TAGLINE}\n\nVersion ${APP_VERSION}\n\nA professional code editor built with Electron, Monaco, and TypeScript.\n\n© Deadeye Studio`,
    actions: [
      {
        label: 'Close',
        variant: 'primary',
        onClick: () => modal.close(),
      },
    ],
  })
}
