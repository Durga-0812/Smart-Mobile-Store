import React from "react";

function InputField({
label,
type = "text",
name,
value,
onChange,
placeholder = "",
required = false,
icon,
}) {
return ( <div className="input-field">
{label && <label htmlFor={name}>{label}</label>}

```
  <div className="input-field-wrapper">
    {icon && <span className="input-field-icon">{icon}</span>}

    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  </div>
</div>


);
}

export default InputField;
