import React from "react";
import "./Wheel.css";

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SEGMENTS = 10;
const RADIUS = 210;
const CENTER = 220;

function Wheel({ number, wheelAngle, winningNumberToDisplay }) {
  const anglePerSegment = 360 / SEGMENTS;
  const targetAngle = 360 * 5 - number * anglePerSegment - anglePerSegment / 2;

  return (
    <div className="wheel-svg-container">
      <svg width={440} height={440} viewBox="0 0 440 440">
        {/* Rotating wheel group */}
        <g
          style={{
            transform: `rotate(${wheelAngle}deg)`,
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transition: "transform 5s cubic-bezier(0.4,2,0.6,1)",
            filter: "drop-shadow(0 0 20px #FFD700)",
          }}
        >
          {/* Draw segments */}
          {numbers.map((num, idx) => {
            const startAngle = (idx * 2 * Math.PI) / SEGMENTS;
            const endAngle = ((idx + 1) * 2 * Math.PI) / SEGMENTS;
            const x1 = CENTER + RADIUS * Math.sin(startAngle);
            const y1 = CENTER - RADIUS * Math.cos(startAngle);
            const x2 = CENTER + RADIUS * Math.sin(endAngle);
            const y2 = CENTER - RADIUS * Math.cos(endAngle);
            const isActive = number === num;
            return (
              <path
                key={num}
                d={`M${CENTER},${CENTER} L${x1},${y1} A${RADIUS},${RADIUS} 0 0,1 ${x2},${y2} Z`}
                fill={
                  idx % 2 === 0 ? "#FFF8DC" : "#FFD700" // Segments: Alternating light yellow and golden
                }
                stroke="#B8860B"
                strokeWidth={2}
                style={{ transition: "fill 0.3s" }}
              />
            );
          })}
          {/* Draw segment lines */}
          {numbers.map((num, idx) => {
            const angle = (idx * 2 * Math.PI) / SEGMENTS;
            const x = CENTER + RADIUS * Math.sin(angle);
            const y = CENTER - RADIUS * Math.cos(angle);
            return (
              <line
                key={"line-" + idx}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="#B8860B"
                strokeWidth={3}
              />
            );
          })}
          {/* Draw numbers */}
          {numbers.map((num, idx) => {
            const angle = ((idx + 0.5) * 2 * Math.PI) / SEGMENTS;
            const x = CENTER + (RADIUS - 62) * Math.sin(angle);
            const y = CENTER - (RADIUS - 62) * Math.cos(angle) + 14;
            const isActive = number === num;
            return (
              <text
                key={"text-" + num}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={isActive ? 48 : 36}
                fontWeight={isActive ? 800 : 600}
                fill={
                  idx % 2 === 0
                    ? "#FFD700"
                    : "#FFF8DC" /* Numbers: Golden on light segments, light on golden segments */
                }
                style={{
                  textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                  transition: "fill 0.3s, font-size 0.3s",
                }}
              >
                {num}
              </text>
            );
          })}
        </g>
        {/* Fixed pointer (diamond) at the top */}
        <polygon
          points={`
            ${CENTER},${CENTER - RADIUS - 40}
            ${CENTER - 28},${CENTER - RADIUS - 8}
            ${CENTER},${CENTER - RADIUS + 28}
            ${CENTER + 28},${CENTER - RADIUS - 8}
          `}
          fill="#fff"
          stroke="#FFD700"
          strokeWidth={5}
          filter="drop-shadow(0 2px 12px #B8860B88)"
        />
        {/* Display winning number near pointer */}
        {winningNumberToDisplay !== null && (
          <text
            x={CENTER}
            y={CENTER - RADIUS - 15} // Position above the pointer
            textAnchor="middle"
            fontSize={40} // Adjust size as needed
            fontWeight={800} // Adjust weight as needed
            fill="#FFD700" // Golden color for the winning number
            style={{
              textShadow: "1px 1px 3px rgba(0, 0, 0, 0.6)", // Shadow for readability
            }}
          >
            {winningNumberToDisplay}
          </text>
        )}
      </svg>
    </div>
  );
}

export default Wheel;
