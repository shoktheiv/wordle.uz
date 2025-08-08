import './App.css';
import React, { useState, useEffect } from 'react';

let targetWord = "";

function App() {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [wordList, setWordList] = useState([]);
  const [usedKeys, setUsedKeys] = useState({});
  const [fullWordList, setFullWordList] = useState([]);
  const [notification, setNotification] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

useEffect(() => {
  fetch("common_words.txt")
    .then(res => res.text())
    .then(text => {
      const words = text.split("\n").map(word => word.trim().toLowerCase());
      setWordList(words);
      const randomIndex = Math.floor(Math.random() * words.length);
      targetWord = words[randomIndex];
    })
    .catch(err => console.error("Failed to load word list:", err));
}, []);

useEffect(() => {
  fetch("words.txt")
    .then(res => res.text())
    .then(text => {
      const words = text.split("\n").map(word => word.trim().toLowerCase());
      setFullWordList(words);
    })
    .catch(err => console.error("Failed to load full word list:", err));
}, []);

  const uzbekLetters = [
    "a", "b", "d", "e", "f", "g", "g‘", "h", "i", "j", "k", "l",
    "m", "n", "o", "o‘", "p", "q", "r", "s", "t", "u", "v", "x", "y", "z"
  ];

  const showNotification = (message) => {
    setNotification(message);
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => setNotification(""), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (key === 'enter') {
        handleEnter();
      } else if (key === 'backspace') {
        handleBackspace();
      } else {
        // Special cases for letters like "o‘" and "g‘"
        if (key === "o" && event.code === "Quote") {
          handleKeyPress("o‘");
        } else if (event.key === "G" && event.shiftKey) {
          handleKeyPress("g‘");
        } else if (uzbekLetters.includes(key)) {
          handleKeyPress(key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, guesses, isGameOver]);

  const handleKeyPress = (letter) => {
    if (isGameOver) return;
    if (currentGuess.length < 5) {
      setCurrentGuess(prev => [...prev, letter]);
    }
  };

  const handleBackspace = () => {
    if (isGameOver) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  // Helper function for coloring logic
  const getColoring = (guess, target) => {
    const result = Array(5).fill("gray");
    const targetLetterCount = {};

    for (let letter of target) {
      targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
    }

    // First pass: mark greens
    for (let i = 0; i < 5; i++) {
      if (guess[i] === target[i]) {
        result[i] = "green";
        targetLetterCount[guess[i]]--;
      }
    }

    // Second pass: mark yellows
    for (let i = 0; i < 5; i++) {
      if (
        result[i] === "gray" &&
        target.includes(guess[i]) &&
        targetLetterCount[guess[i]] > 0
      ) {
        result[i] = "yellow";
        targetLetterCount[guess[i]]--;
      }
    }

    return result;
  };

  const handleEnter = async () => {
    if (isGameOver) return;
    if (currentGuess.length !== 5) {
      showNotification("5 harfdan iborat so‘z kiriting!");
      return;
    }

    const guessStr = currentGuess.join('').toLowerCase();

    if (!fullWordList.includes(guessStr)) {
      showNotification("So‘z ro‘yxatda yo‘q.");
      return;
    }

    const updatedGuesses = [...guesses, currentGuess];
    setGuesses(updatedGuesses);

    const coloring = getColoring(currentGuess, targetWord);
    setUsedKeys(prevUsedKeys => {
      const updated = { ...prevUsedKeys };
      currentGuess.forEach((letter, idx) => {
        const color = coloring[idx];
        if (
          color === "green" ||
          (color === "yellow" && updated[letter] !== "green") ||
          (color === "gray" && !updated[letter])
        ) {
          updated[letter] = color;
        }
      });
      return updated;
    });

    setCurrentGuess([]);

    if (guessStr === targetWord) {
      setIsGameOver(true);
      showNotification("🎉 To‘g‘ri topdingiz!");
    } else if (updatedGuesses.length >= 6) {
      setIsGameOver(true);
      showNotification(`❌ Tugadi! So‘z: ${targetWord}`);
    }
  };

  const getTileClass = (letter, index, guess) => {
    if (!guesses.includes(guess)) return "";
    const coloring = getColoring(guess, targetWord);
    return coloring[index];
  };

  return (
    <div className="App">
      <h1 className="title">Wordle.uz</h1>
      {notification && <div className="notification">{notification}</div>}
      {}
      {showTutorial && (
        <div className="tutorial-panel">
          <div className="tutorial-content">
            <h2>Qanday o‘ynash kerak</h2>
            <p>5 harfdan iborat so‘zni 6 urinishda toping. Har bir urinishdan so‘ng harflarning rangi ularning to‘g‘ri so‘zga mos kelish-kelmasligini ko‘rsatadi.</p>
            <ul>
              <li><span className="green">S</span> - Harf ham pozitsiyasi ham to‘g‘ri.</li>
              <li><span className="yellow">S</span> - Harf to‘g‘ri, lekin joylashuvi noto‘g‘ri.</li>
              <li><span className="gray">S</span> - Harf so‘zda yo‘q.</li>
            </ul>
            <button onClick={() => setShowTutorial(false)}>X</button>
          </div>
        </div>
      )}
      <div className="board">
        {[...Array(6)].map((_, rowIdx) => {
          const word = guesses[rowIdx] || (rowIdx === guesses.length ? currentGuess : []);
          return (
            <div className="row" key={rowIdx}>
              {[...Array(5)].map((_, colIdx) => {
                const letter = word[colIdx] || "";
                const colorClass = guesses[rowIdx] ? getTileClass(letter, colIdx, word) : "";
                return (
                  <div className={`tile ${colorClass}`} key={colIdx}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="keyboard">
        <div className="keyboard-row">
          {["q", "o'", "e", "r", "t", "y", "u", "i", "o", "p"].map((letter) => (
            <button key={letter} className={usedKeys[letter]} onClick={() => handleKeyPress(letter)}>
              {letter}
            </button>
          ))}
        </div>
        <div className="keyboard-row">
          {["a", "s", "d", "f", "g", "h", "j", "k", "l", "g'"].map((letter) => (
            <button key={letter} className={usedKeys[letter]} onClick={() => handleKeyPress(letter)}>
              {letter}
            </button>
          ))}
        </div>
        <div className="keyboard-row">
          <button className="key-wide" onClick={handleBackspace}>←</button>
          {["z", "x", "c", "v", "b", "n", "m"].map((letter) => (
            <button key={letter} className={usedKeys[letter]} onClick={() => handleKeyPress(letter)}>
              {letter}
            </button>
          ))}
          <button className="key-wide" onClick={handleEnter}>↵</button>
        </div>
      </div>
      <button
        className="theme-toggle"
        onClick={() => document.body.classList.toggle("light-mode")}
      >
        ☀
      </button>
      <button
        className="help-button"
        onClick={() => setShowTutorial(true)}
      >
        ?
      </button>
    </div>
  );
}

export default App;