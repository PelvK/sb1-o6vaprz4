import React from 'react';
import './Checkbox.css';

type CheckboxProps = {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
};

export const Checkbox: React.FC<CheckboxProps> = ({
    checked = false,
    onChange,
    label,
    disabled = false,
    id,
    className = '',
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e.target.checked);
        }
    };

    return (
        <label className={`checkbox ${disabled ? 'checkbox--disabled' : ''} ${className}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                id={id}
                className="checkbox_input"
            />
            <span className="checkbox_custom" />
            {label && <span className="checkbox_label">{label}</span>}
        </label>
    );
};
