import { useState, useEffect, useRef, useCallback } from "react";
import Wheel from "./components/Wheel";
import HistoryTable from "./components/HistoryTable";
import NavButtons from "./components/NavButtons";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import AdminPanel from "./components/AdminPanel";
import Confetti from "react-confetti";

const SEGMENTS = 10;
const API_URL = "http://localhost:4000/history";
const API_NEXT_SPIN_TIME_URL = "http://localhost:4000/next-spin-time";
const API_NEXT_SPIN_NUMBER_URL = "http://localhost:4000/next-spin-number";
const COOLDOWN_TIME = 5 * 60; // 5 minutes in seconds
const CALIBRATION_OFFSET = -3; // Adjust this value for fine-tuning pointer alignment
const HISTORY_STORAGE_KEY = "wheelSpinHistory";

function App() {
  // State declarations
  const [history, setHistory] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [showRule, setShowRule] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [lastWheelAngle, setLastWheelAngle] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [lastGuess, setLastGuess] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [forcedNumber, setForcedNumber] = useState(null);
  const [displayedWinningNumber, setDisplayedWinningNumber] = useState(null);
  const [showWinningNumber, setShowWinningNumber] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [nextSpinTime, setNextSpinTime] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [shouldSpinNow, setShouldSpinNow] = useState(false);

  // Ref declarations
  const audioRef = useRef(null);
  const spinSoundRef = useRef(null);
  const stopSoundRef = useRef(null);
  const winSoundRef = useRef(null);
  const loseSoundRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  // Utility and useCallback function definitions (ordered for dependencies)
  const getDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };
  };

  const playSound = useCallback(
    (soundRef) => {
      if (!isMuted && soundRef.current) {
        soundRef.current.currentTime = 0;
        soundRef.current.play();
      }
    },
    [isMuted]
  );

  const stopSound = useCallback((soundRef) => {
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.currentTime = 0;
    }
  }, []);

  const calculateNextSpinTime = useCallback(() => {
    const now = new Date();
    const currentMinute = now.getUTCMinutes();
    const currentSecond = now.getUTCSeconds();

    // Calculate minutes until next 5-minute mark
    const minutesUntilNext = 5 - (currentMinute % 5);
    const secondsUntilNext = minutesUntilNext * 60 - currentSecond;

    // Create next spin time
    const nextSpinTime = new Date(now.getTime() + secondsUntilNext * 1000);
    return nextSpinTime;
  }, []);

  const fetchNextSpinTime = useCallback(async () => {
    try {
      const nextTime = calculateNextSpinTime();
      setNextSpinTime(nextTime);
    } catch (error) {
      console.error("Failed to calculate next spin time:", error);
      const now = new Date();
      const fallbackTime = new Date(now.getTime() + COOLDOWN_TIME * 1000);
      setNextSpinTime(fallbackTime);
    }
  }, [calculateNextSpinTime]);

  // Fetch history from server
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, []);

  // Initial history fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const spinWheel = useCallback(() => {
    if (spinning) return; // Prevent multiple spins at once

    setSpinning(true);
    setDisplayedWinningNumber(null);
    setShowWinningNumber(false);

    // Play spinning sound
    playSound(spinSoundRef);

    // Get the winning number from server
    fetch(API_NEXT_SPIN_NUMBER_URL)
      .then((response) => response.json())
      .then((data) => {
        const number = forcedNumber !== null ? forcedNumber : data.number;

        const anglePerSegment = 360 / SEGMENTS;
        const numSpins = 5; // Ensure multiple spins

        const angleOfWinningSegmentCenter =
          number * anglePerSegment + anglePerSegment / 2;
        const desiredAbsoluteStopAngle =
          (360 - (angleOfWinningSegmentCenter % 360)) % 360;

        const currentEffectiveAngle = lastWheelAngle % 360;

        let rotationNeeded =
          (desiredAbsoluteStopAngle - currentEffectiveAngle + 360) % 360;

        if (rotationNeeded < 5) {
          rotationNeeded += 360;
        }

        const totalRotationAngle =
          lastWheelAngle + rotationNeeded + numSpins * 360 + CALIBRATION_OFFSET;

        setWheelAngle(totalRotationAngle);
        setLastWheelAngle(totalRotationAngle);

        setTimeout(() => {
          // Stop spinning sound and play stop sound
          stopSound(spinSoundRef);
          playSound(stopSoundRef);

          setCurrentNumber(number);
          setDisplayedWinningNumber(number);
          setWinningNumber(number); // Set the winning number
          setShowWinningNumber(true); // Show the winning number popup
          setShowConfetti(true); // Start confetti

          const newSpin = {
            ...getDateTime(),
            number,
            userGuess: null,
          };

          // Save to backend
          fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newSpin),
          })
            .then((response) => response.json())
            .then((data) => {
              setHistory(data.history); // Update history with server response
            })
            .catch((error) => {
              console.error("Failed to save spin:", error);
            });

          setSpinning(false);
          setShowResult(false);
          fetchNextSpinTime();
        }, 5050);
      })
      .catch((error) => {
        console.error("Failed to get next spin number:", error);
        setSpinning(false);
        alert("Failed to get spin number. Please try again.");
      });
  }, [
    spinning,
    playSound,
    stopSound,
    forcedNumber,
    lastWheelAngle,
    getDateTime,
    fetchNextSpinTime,
  ]);

  // Remove the history fetch useEffect since we're using localStorage now
  useEffect(() => {
    fetchNextSpinTime();
  }, [fetchNextSpinTime]);

  // Restore the shouldSpinNow effect for automatic spinning
  useEffect(() => {
    if (shouldSpinNow) {
      spinWheel();
      fetchNextSpinTime();
      setShouldSpinNow(false); // Reset the trigger
    }
  }, [shouldSpinNow, spinWheel, fetchNextSpinTime]);

  useEffect(() => {
    if (!nextSpinTime) return;

    // Clear any existing interval
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    // Calculate initial cooldown immediately
    const now = new Date();
    const initialDiffInSeconds = Math.floor(
      (nextSpinTime.getTime() - now.getTime()) / 1000
    );
    setCooldown(Math.max(0, initialDiffInSeconds));

    cooldownTimerRef.current = setInterval(() => {
      const now = new Date();
      const diffInSeconds = Math.floor(
        (nextSpinTime.getTime() - now.getTime()) / 1000
      );
      setCooldown(Math.max(0, diffInSeconds));

      if (diffInSeconds <= 0 && !spinning) {
        setShouldSpinNow(true); // Trigger the spin and fetch via state
      }
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [nextSpinTime, spinning]);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update history in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  return (
    <div className="container py-0">
      {/* Title */}
      <h2 className="text-center mb-0" style={{ color: "#FFD700" }}>
        Battle Wheel Spin
      </h2>
      {/* Next Spin Time (Exact) */}
      {nextSpinTime && (
        <div
          className="text-center mb-0"
          style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}
        >
          NEXT SPIN AT:{" "}
          {nextSpinTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      )}
      {/* Next Spin Timer (Countdown) */}
      <div className="text-center mb-0" style={{ fontSize: 18, color: "#ccc" }}>
        Spinning in:{" "}
        {cooldown > 0
          ? `${Math.floor(cooldown / 60)
              .toString()
              .padStart(2, "0")}:${(cooldown % 60).toString().padStart(2, "0")}`
          : "Spinning..."}
      </div>
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={250}
          recycle={false}
        />
      )}
      <audio ref={audioRef} src="/correct.mp3" preload="auto" />
      <audio ref={spinSoundRef} src="/wheel-spin.mp3" preload="auto" loop />
      <audio ref={stopSoundRef} src="/wheel-stop.mp3" preload="auto" />
      <audio ref={winSoundRef} src="/win-sound.mp3" preload="auto" />
      <audio ref={loseSoundRef} src="/lose-sound.mp3" preload="auto" />
      <div className="row justify-content-center mb-0 mt-0">
        <div className="col-12 d-flex flex-column align-items-center">
          <Wheel
            number={currentNumber}
            wheelAngle={wheelAngle}
            highlightPointer={showResult}
            winningNumberToDisplay={displayedWinningNumber}
          />
          <div className="d-flex flex-column align-items-center mt-0">
            <Button
              className="spin-btn golden-spin-button"
              size="lg"
              variant="warning"
              onClick={spinWheel}
              disabled={spinning || cooldown > 0}
            >
              Place Your Bet
            </Button>
          </div>
        </div>
      </div>
      <h4 className="mb-0 mt-0">History</h4>
      <HistoryTable history={history} />
      <div className="d-flex justify-content-center mt-0">
        <NavButtons
          onRule={() => setShowRule(true)}
          onContact={() => setShowContact(true)}
          onHistory={() => setShowHistoryModal(true)}
        />
      </div>
      {/* Rule Modal */}
      <Modal
        show={showRule}
        onHide={() => setShowRule(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Game Rules</Modal.Title>
          <Modal.Title>🎯 Digital Battle Wheel Spin</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundImage:
              "linear-gradient(to right,    #1a142d, #3a1f4a, #5c3a6b, #ffd700 )",
            color: "#fff",
          }}
        >
          <ul>
            <li>
              1. Objective of the Game: This is an entertainment-based wheel
              spin game where users can place friendly bets with their friends
              or groups (such as on Telegram, WhatsApp, etc.) and enjoy the fun
              together.
            </li>
            <li>
              2. Wheel Spin Details: The wheel will automatically spin every 15
              minutes. Each spin will last for 10 seconds. The wheel contains 10
              digits ranging from 0 to 9. The digit on which the arrow stops at
              the end of the spin will be considered the winning number.
            </li>
            <li>
              3. How to Play: Before the game starts, each participant must
              choose a number between 0 and 9. By the time the wheel spins, all
              participants should have made their selections. The person whose
              chosen number matches the final stopping point of the wheel will
              be the winner.
            </li>
            <li>
              4. Betting and Entertainment: This game is meant solely for
              entertainment purposes. Players can place bets mutually and
              respectfully with friends. The platform holds no financial
              involvement or responsibility in any bets placed.
            </li>
            <li>
              5. Results and Transparency: The result of each spin will be
              instantly displayed in the table below. All outcomes are generated
              through a fully automated and fair system.
            </li>
            <li>
              6. Discipline and Prohibition: Any user involved in tampering,
              misconduct, or abusive language may be blocked or banned from the
              platform.
            </li>
            <li>
              7. Changes to Rules: The rules of the game are subject to
              modification as needed, without prior notice.
            </li>
          </ul>
          <div className="mt-4 pt-3 border-top">
            <button
              className="btn btn-dark w-100"
              onClick={() => setShowAdmin(!showAdmin)}
            >
              {showAdmin ? "Help" : "Help"}
            </button>
          </div>
          {showAdmin && (
            <div className="admin-panel-container mt-4 pt-3 border-top">
              {/*} <h5 className="mb-3">Admin Panel</h5>*/}
              <AdminPanel
                onHistoryChanged={() => {
                  fetch(API_URL)
                    .then((res) => res.json())
                    .then((data) => setHistory(data));
                }}
                forcedNumber={forcedNumber}
                onForcedNumberChange={setForcedNumber}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRule(false);
              setShowAdmin(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Contact Modal */}
      <Modal show={showContact} onHide={() => setShowContact(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundImage:
              "linear-gradient(to right,    #1a142d, #3a1f4a, #5c3a6b, #ffd700 )",
            color: "#fff",
          }}
        >
          <p>For support, contact:</p>
          <ul>
            <li>
              Email:{" "}
              <a href="mailto:support@example.com">
                support@battlewheelspin.com
              </a>
            </li>
            <li>Games2win company ke name hai</li>
            <li>
              Games2win is one of the largest casual gaming companies in the
              world. Their objective is to enrich the online gaming experience,
              and they are always on the lookout for viable partnerships. They
              own 700+ online games and have over 45 million downloads worldwide
              on the iOS, Android
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContact(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* History Modal */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>All Spin History</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundImage:
              "linear-gradient(to right,    #1a142d, #3a1f4a, #5c3a6b, #ffd700 )",
            color: "#333",
          }}
        >
          <HistoryTable history={history} />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowHistoryModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Winning Number Popup Modal */}
      <Modal
        show={showWinningNumber}
        onHide={() => setShowWinningNumber(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header
          className=" text-white"
          style={{
            backgroundImage:
              "linear-gradient(to right,    #1a142d, #3a1f4a, #5c3a6b, #ffd700 )",
          }}
        >
          <Modal.Title className="w-100 text-center">
            Congratulations
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="text-center py-4"
          style={{
            backgroundImage:
              "linear-gradient(to right,    #1a142d, #ffd700, #3a1f4a, #5c3a6b )",
          }}
        >
          <div
            className="mb-3"
            style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff" }}
          >
            We have a Winner!
          </div>
          <div
            style={{
              fontSize: "6rem", // Increased font size
              fontWeight: "bold",
              color: "#fff", // Changed to white to match image
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)", // Adjusted text shadow
              // Keeping background image as it provides a gradient effect in the modal body
              backgroundImage:
                "linear-gradient(to right,    #1a142d, #3a1f4a, #5c3a6b, #ffd700 )",
              borderRadius: "15px", // Added border radius for a softer look
              padding: "20px", // Added padding
            }}
          >
            {winningNumber}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark">
          <Button
            className="w-100" // Full width button
            style={{
              background: "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)", // Gradient background
              border: "none",
              padding: "15px 30px",
              fontSize: "1.5rem",
              fontWeight: "bold",
              borderRadius: "30px", // Rounded corners
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              color: "#fff", // White text
            }}
            onClick={() => {
              setShowWinningNumber(false);
              setShowConfetti(false);
            }}
          >
            Remove
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Sound Toggle Button */}
      <button
        className="btn btn-outline-warning position-fixed top-0 end-0 m-1 mute-button-small"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

export default App;
