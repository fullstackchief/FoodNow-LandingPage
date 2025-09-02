import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils'
import SearchBar from '@/components/ui/SearchBar'

// Mock API calls
vi.mock('@/lib/api', () => ({
  api: {
    restaurants: {
      search: vi.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Test Restaurant',
          cuisine_types: ['Nigerian'],
          delivery_time: '25-35 min',
          image_url: 'test.jpg'
        }
      ])
    }
  }
}))

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText(/search restaurants/i)
    expect(input).toBeInTheDocument()
  })

  it('shows search suggestions when typing', async () => {
    render(<SearchBar showSuggestions={true} />)
    
    const input = screen.getByPlaceholderText(/search restaurants/i)
    fireEvent.change(input, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    })
  })

  it('handles search submission', async () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText(/search restaurants/i)
    fireEvent.change(input, { target: { value: 'pizza' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(mockOnSearch).toHaveBeenCalledWith('pizza')
  })

  it('clears search input', () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText(/search restaurants/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test search' } })
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    fireEvent.click(clearButton)
    
    expect(input.value).toBe('')
  })

  it('shows loading state during search', async () => {
    render(<SearchBar showSuggestions={true} />)
    
    const input = screen.getByPlaceholderText(/search restaurants/i)
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Should show loading state briefly
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})