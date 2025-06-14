# Battle Wheel Spin

A fun, interactive web app where you spin a wheel (numbers 0–9) and track your results! Built with React, Bootstrap, and custom CSS.

## Features

- Animated spinning wheel (0–9)
- Auto-spin every 15 seconds
- Manual spin with user number input
- Live history table (date, time, spun number, user guess)
- Responsive, mobile-friendly design
- Bootstrap UI with custom wheel styling
- Navigation buttons: History, Rule, Contact

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd battle-wheel-spin
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

- The wheel spins automatically every 15 seconds.
- Enter a number (0–9) and click "Spin" to make a manual guess and spin.
- View all spins in the "Today's History" table.
- Use the navigation buttons for future features (rules, contact, full history).

## Tech Stack

- [React](https://react.dev/)
- [Bootstrap 5](https://getbootstrap.com/)
- Custom CSS for the wheel
- Vite (for fast development)

## Project Structure

```
battle-wheel-spin/
  ├── src/
  │   ├── components/
  │   │   ├── Wheel.jsx, Wheel.css
  │   │   ├── NumberInput.jsx
  │   │   ├── HistoryTable.jsx
  │   │   └── NavButtons.jsx
  │   ├── App.jsx, App.css
  │   └── ...
  ├── public/
  └── README.md
```

## License

MIT
