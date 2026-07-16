/// <reference types="vite/client" />

import type { DeadeyeAPI } from '../shared/api'

declare global {
  interface Window {
    deadeye: DeadeyeAPI
  }
}

export {}
