export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, variant = 'default', type = 'button', disabled, className = '' }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
    outline: 'border border-gray-300 hover:bg-gray-50 disabled:opacity-50',
    ghost: 'hover:bg-gray-100 disabled:opacity-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};