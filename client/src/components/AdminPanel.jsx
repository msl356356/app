import React, { useState } from "react";
import { Button, Form, InputGroup, Alert } from "react-bootstrap";

// We get the API URL from the environment variables for the frontend
const API_BASE_URL = import.meta.env.VITE_API_URL;

function AdminPanel({ onHistoryChanged, forcedNumber, onForcedNumberChange }) {
  const [password, setPassword] = useState("");
  const [deleteIndex, setDeleteIndex] = useState("");
  const [status, setStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // NO ADMIN_PASSWORD variable should be here.

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      // Step 1: Send the password from the input field to the backend
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      // Step 2: Check if the backend responded with success
      if (res.ok) {
        setIsAuthenticated(true);
        setStatus({ type: "success", msg: "Login successful" });
      } else {
        setStatus({ type: "danger", msg: data.error || "Invalid password" });
      }
    } catch (error) {
      console.error("Login failed:", error);
      setStatus({
        type: "danger",
        msg: "Login request failed. Is the server running?",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setStatus(null);
  };

  // The functions below are correct because they send the password from the state
  // to the backend for verification on every action.
  const handleClear = async () => {
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: "History cleared." });
        onHistoryChanged && onHistoryChanged();
      } else {
        setStatus({
          type: "danger",
          msg: data.error || "Failed to clear history",
        });
      }
    } catch (error) {
      setStatus({ type: "danger", msg: "Failed to clear history" });
    }
  };

  const handleDownload = () => {
    window.open(`${API_BASE_URL}/admin/download`, "_blank");
  };

  const handleDelete = async () => {
    // ... (This function is also correct as it sends the password to the backend)
    setStatus(null);
    if (deleteIndex === "" || isNaN(deleteIndex)) {
      setStatus({ type: "danger", msg: "Enter a valid index." });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, index: Number(deleteIndex) }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: "Entry deleted." });
        onHistoryChanged && onHistoryChanged();
      } else {
        setStatus({
          type: "danger",
          msg: data.error || "Failed to delete entry",
        });
      }
    } catch (error) {
      setStatus({ type: "danger", msg: "Failed to delete entry" });
    }
  };

  // The rest of your JSX for rendering the form and buttons remains the same...
  // ... (pasting the rest of the file for completeness) ...
  if (!isAuthenticated) {
    return (
      <div className="p-3 border rounded bg-light">
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Write Your Query"
            />
          </Form.Group>
          <Button type="submit" variant="primary">
            Submit
          </Button>
        </Form>
        {status && (
          <Alert variant={status.type} className="mt-3">
            {status.msg}
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Admin Tools</h5>
        <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="d-flex gap-2 mb-2">
        <Button variant="danger" onClick={handleClear}>
          Clear All History
        </Button>
        <Button variant="secondary" onClick={handleDownload}>
          Download History
        </Button>
      </div>
      <InputGroup className="mb-2" style={{ maxWidth: 220 }}>
        <Form.Control
          type="number"
          min={0}
          value={deleteIndex}
          onChange={(e) => setDeleteIndex(e.target.value)}
          placeholder="Delete index (0=latest)"
        />
        <Button variant="warning" onClick={handleDelete}>
          Delete Entry
        </Button>
      </InputGroup>

      {/* Advanced Controls */}
      <div className="mt-3 pt-3 border-top">
        <Button
          variant="link"
          className="p-0 mb-2 text-muted"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Hide Advanced Controls" : "Show Advanced Controls"}
        </Button>

        {showAdvanced && (
          <div className="mt-2">
            <Form.Group className="mb-2">
              <Form.Label className="text-muted small">
                Force Next Number
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min={0}
                  max={9}
                  value={forcedNumber !== null ? forcedNumber.toString() : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (
                      val === "" ||
                      (/^\d$/.test(val) && val >= 0 && val <= 9)
                    ) {
                      onForcedNumberChange(val === "" ? null : Number(val));
                    }
                  }}
                  placeholder="Enter number (0-9)"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => onForcedNumberChange(null)}
                >
                  Clear
                </Button>
              </InputGroup>
              <Form.Text className="text-muted small">
                {forcedNumber !== null
                  ? `Next spin will land on ${forcedNumber}`
                  : "No number forced"}
              </Form.Text>
            </Form.Group>
          </div>
        )}
      </div>

      {status && <Alert variant={status.type}>{status.msg}</Alert>}
    </div>
  );
}

export default AdminPanel;
