export type ActionConfirm = {
  title: string
  message: string
  confirmLabel?: string
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'
  run: () => Promise<void> | void
}

export function useActionConfirm() {
  const confirmDialog = ref(false)
  const confirming = ref(false)
  const confirmAction = ref<ActionConfirm | null>(null)

  function askConfirm(action: ActionConfirm) {
    confirmAction.value = action
    confirmDialog.value = true
  }

  async function runConfirmedAction() {
    if (!confirmAction.value) return
    confirming.value = true
    try {
      await confirmAction.value.run()
      confirmDialog.value = false
      confirmAction.value = null
    } finally {
      confirming.value = false
    }
  }

  function cancelConfirmedAction() {
    if (confirming.value) return
    confirmDialog.value = false
    confirmAction.value = null
  }

  return {
    confirmDialog,
    confirming,
    confirmAction,
    askConfirm,
    runConfirmedAction,
    cancelConfirmedAction,
  }
}
