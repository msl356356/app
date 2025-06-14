import React, { useState } from "react";
import { Button, Form, InputGroup, Alert } from "react-bootstrap";

const API_URL = "http://localhost:4000";
const ADMIN_PASSWORD = "akash8454"; // Match with server.cjs password

function AdminPanel({ onHistoryChanged, forcedNumber, onForcedNumberChange }) {
  const [password, setPassword] = useState("");
  const [deleteIndex, setDeleteIndex] = useState("");
  const [status, setStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setStatus({ type: "success", msg: "Login successful" });
    } else {
      setStatus({ type: "danger", msg: "Write valid query" });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setStatus(null);
  };

  const handleClear = async () => {
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/admin/clear`, {
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
    window.open(`${API_URL}/admin/download`, "_blank");
  };

  const handleDelete = async () => {
    setStatus(null);
    if (deleteIndex === "" || isNaN(deleteIndex)) {
      setStatus({ type: "danger", msg: "Enter a valid index." });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/delete`, {
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
