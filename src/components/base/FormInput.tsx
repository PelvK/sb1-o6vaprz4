import { InputHTMLAttributes } from 'react';
import './FormInput.css';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = ({ label, error, className = '', ...props }: FormInputProps) => {
  return (
    <div className="form-input-wrapper">
      {label && <label className="form-label">{label}</label>}
      <input
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
