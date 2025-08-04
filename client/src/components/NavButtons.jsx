import React from "react";
import { Button } from "react-bootstrap";

function NavButtons({ onRule, onContact, onHistory }) {
  return (
    <div className="d-flex flex-wrap justify-content-center gap-2">
      <Button variant="secondary" onClick={onHistory}>
        History
      </Button>
      <Button variant="secondary" onClick={onRule}>
        Rule
      </Button>
      <Button variant="secondary" onClick={onContact}>
        Contact
      </Button>
    </div>
  );
}

export default NavButtons;
