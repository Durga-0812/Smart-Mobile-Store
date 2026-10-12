import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

export default function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required = false,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const actualType =
    type === "password" && showPassword ? "text" : type;

  return (
    <div className="field">
      {label && <label>{label}</label>}

      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}

        <input
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />

        {type === "password" && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
