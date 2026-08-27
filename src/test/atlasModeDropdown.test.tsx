import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import AtlasModeDropdown from '../components/AtlasModeDropdown'
import { useMapStore } from '../store/useMapStore'

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /Atlas/ }))
}

describe('AtlasModeDropdown', () => {
  beforeEach(() => {
    useMapStore.setState({ atlasMode: 'wildlife', locale: 'en' })
  })

  afterEach(cleanup)

  it('renders the trigger with current mode and visible counts', () => {
    render(<AtlasModeDropdown count={186} regionCount={10} />)
    const trigger = screen.getByRole('button', { name: 'World Wildlife Atlas' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('186 countries')
  })

  it('opens a listbox listing both modes and marks the active one', () => {
    render(<AtlasModeDropdown count={186} regionCount={10} />)
    openMenu()
    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['Wildlife', 'Era Purba'])
    expect(screen.getByRole('option', { name: 'Wildlife' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('option', { name: 'Era Purba' }).getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('button', { name: 'World Wildlife Atlas' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('switches to Era Purba, swaps copy, and closes the menu', () => {
    render(<AtlasModeDropdown count={31} regionCount={6} />)
    openMenu()
    fireEvent.click(screen.getByRole('option', { name: 'Era Purba' }))
    expect(useMapStore.getState().atlasMode).toBe('prehistoric')
    expect(screen.queryByRole('listbox')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Era Purba Atlas' })
    expect(trigger.textContent).toContain('31 dinosaurs')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('switches back to Wildlife from Era Purba', () => {
    useMapStore.setState({ atlasMode: 'prehistoric' })
    render(<AtlasModeDropdown count={31} regionCount={6} />)
    openMenu()
    fireEvent.click(screen.getByRole('option', { name: 'Wildlife' }))
    expect(useMapStore.getState().atlasMode).toBe('wildlife')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'World Wildlife Atlas' })).toBeTruthy()
  })

  it('keeps the menu closed state and mode unchanged when Escape is pressed', () => {
    render(<AtlasModeDropdown count={186} regionCount={10} />)
    openMenu()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(useMapStore.getState().atlasMode).toBe('wildlife')
  })

  it('re-selecting the active mode closes without resetting store state', () => {
    useMapStore.setState({ searchQuery: 'panda' })
    render(<AtlasModeDropdown count={186} regionCount={10} />)
    openMenu()
    fireEvent.click(screen.getByRole('option', { name: 'Wildlife' }))
    expect(useMapStore.getState().atlasMode).toBe('wildlife')
    expect(useMapStore.getState().searchQuery).toBe('panda')
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
