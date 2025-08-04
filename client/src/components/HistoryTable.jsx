import React from "react";
import { Table } from "react-bootstrap";

function HistoryTable({ history }) {
  return (
    <div style={{ maxHeight: "150px", overflowY: "auto", padding: 2 }}>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Number</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center">
                No spins yet
              </td>
            </tr>
          ) : (
            history.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.time}</td>
                <td>{row.number}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default HistoryTable;
