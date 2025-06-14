import React from "react";
import { Button, InputGroup, FormControl } from "react-bootstrap";

function NumberInput({ value, setValue, onSubmit }) {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "" || (/^\d$/.test(val) && val >= 0 && val <= 9)) {
      setValue(val);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value !== "" && value >= 0 && value <= 9) {
      onSubmit(Number(value));
    }
  };
  return (
    <form onSubmit={handleSubmit} className="w-100 mt-3">
      <InputGroup>
        <FormControl
          type="number"
          min="0"
          max="9"
          value={value}
          onChange={handleChange}
          placeholder="Enter a number (0-9)"
        />
        <Button type="submit" variant="primary">
          Spin
        </Button>
      </InputGroup>
    </form>
  );
}

export default NumberInput;
