import { useId, type ComponentProps, type ReactNode } from 'react'

type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' }

export function Button({ variant = 'secondary', type = 'button', className = '', ...props }: ButtonProps) {
  return <button {...props} type={type} className={`button button--${variant} ${className}`.trim()} />
}

type TextInputProps = Omit<ComponentProps<'input'>, 'children'> & { label: string }

export function TextInput({ label, id, ...props }: TextInputProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <div className="field">
      <label htmlFor={controlId}>{label}</label>
      <input {...props} id={controlId} />
    </div>
  )
}

type SelectProps = ComponentProps<'select'> & { label: string; children: ReactNode }

export function Select({ label, children, id, ...props }: SelectProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <div className="field">
      <label htmlFor={controlId}>{label}</label>
      <select {...props} id={controlId}>{children}</select>
    </div>
  )
}
