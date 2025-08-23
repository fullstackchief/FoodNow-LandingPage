import { forwardRef } from 'react'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl'
  padding?: boolean
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, maxWidth = '7xl', padding = true, className = '', ...props }, ref) => {
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md', 
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '7xl': 'max-w-7xl'
    }
    
    const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : ''
    
    return (
      <div
        ref={ref}
        className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'

export default Container