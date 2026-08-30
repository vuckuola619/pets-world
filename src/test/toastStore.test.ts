import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from '../store/useToastStore'

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('pushes a toast with a message key', () => {
    useToastStore.getState().pushToast('compareLimit')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].key).toBe('compareLimit')
  })

  it('keeps only the last three toasts', () => {
    const { pushToast } = useToastStore.getState()
    pushToast('compareLimit')
    pushToast('linkCopied')
    pushToast('compareLimit')
    pushToast('linkCopied')
    const keys = useToastStore.getState().toasts.map((t) => t.key)
    expect(keys).toEqual(['linkCopied', 'compareLimit', 'linkCopied'])
  })

  it('dismisses a toast by id', () => {
    useToastStore.getState().pushToast('linkCopied')
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().dismissToast(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
