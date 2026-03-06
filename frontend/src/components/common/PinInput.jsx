import React, { useRef } from 'react';

const PinInput = ({ value = '', onChange, length = 4, label = 'Enter M-PESA PIN' }) => {
  const inputs = useRef([]);

  const handleChange = (idx, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val && !e.target.value) {
      // Backspace
      const newPin = value.split('');
      newPin[idx] = '';
      onChange(newPin.join(''));
      if (idx > 0) inputs.current[idx - 1]?.focus();
      return;
    }
    if (val) {
      const newPin = value.split('');
      newPin[idx] = val[val.length - 1];
      onChange(newPin.join(''));
      if (idx < length - 1) inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const newPin = value.split('');
      newPin[idx - 1] = '';
      onChange(newPin.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(paste.padEnd(length, '').slice(0, length));
    inputs.current[Math.min(paste.length, length - 1)]?.focus();
  };

  return (
    <div>
      {label && <div className="form-label" style={{ textAlign: 'center', marginBottom: 16 }}>{label}</div>}
      <div className="pin-input-wrapper">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={el => inputs.current[idx] = el}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ''}
            onChange={e => handleChange(idx, e)}
            onKeyDown={e => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`pin-digit ${value[idx] ? 'filled' : ''}`}
            autoComplete="off"
          />
        ))}
      </div>
    </div>
  );
};

export default PinInput;