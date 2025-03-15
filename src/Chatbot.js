import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chatbot.css"; // Import external CSS for styling

const API_BASE_URL = "https://movie-mate-dp1x.onrender.com"; // Updated API URL

const Chatbot = () => {
  const [inputType, setInputType] = useState("movie_name");
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatboxRef = useRef(null);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // 🎤 Speech-to-Text Function (Shows Live Transcription)
  const handleSpeechInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // Set language
    recognition.interimResults = true; // Allow real-time text updates
    recognition.start();
    setIsListening(true);

    recognition.onstart = () => console.log("Listening... Speak now!");

    recognition.onresult = (event) => {
      const speechText = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");

      setUserInput(speechText); // Show real-time transcription

      if (event.results[0].isFinal) {
        handleSendMessage(speechText);
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { text: text, sender: "user" }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/recommend`, {
        input_type: inputType,
        user_input: text,
      });

      setTimeout(() => {
        if (response.data.recommendations) {
          const recommendations = response.data.recommendations
            .map(
              (movie) =>
                `<div class="movie-container">
                   <img src="${movie.poster}" alt="${movie.title} Poster" class="movie-poster"/>
                   <b class="movie-title">${movie.title}</b> - ${movie.tagline}<br/>
                   <b>🎭 Genres:</b> ${movie.genres}<br/>
                   <b>🎬 Cast:</b> ${movie.cast}<br/>
                   <b>🔗 Link:</b> ${
                     movie.homepage !== "No link available"
                       ? `<a href="${movie.homepage}" target="_blank" class="movie-link">Click Here</a>`
                       : "No link available"
                   }
                 </div>`
            )
            .join("<br/><br/>");

          setMessages([...newMessages, { text: recommendations, sender: "bot", isHTML: true }]);
        } else {
          setMessages([...newMessages, { text: "No recommendations found.", sender: "bot" }]);
        }
        setIsTyping(false);
      }, 2000);
    } catch (error) {
      setMessages([...newMessages, { text: "Error getting recommendations.", sender: "bot" }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">🎥Movie-Mate</div>

      <div ref={chatboxRef} className="chatbox">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === "user" ? "user-message" : "bot-message"}>
            {msg.isHTML ? (
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            ) : (
              msg.text.split("\n").map((line, i) => <p key={i}>{line}</p> )
            )}
          </div>
        ))}

        {isTyping && (
          <div className="bot-message typing">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <div className="input-area">
        <select className="dropdown" value={inputType} onChange={(e) => setInputType(e.target.value)}>
          <option value="movie_name">🎬 Movie Name</option>
          <option value="mood">😊 Mood</option>
          <option value="text">💬 Text Query</option>
        </select>

        <input
          type="text"
          className="input"
          value={userInput}
          placeholder="Type or Speak..."
          onChange={(e) => setUserInput(e.target.value)}
        />

        <button className={`mic-button ${isListening ? "listening" : ""}`} onClick={handleSpeechInput}>
          🎤
        </button>

        <button className="send-button" onClick={() => handleSendMessage(userInput)}>🚀 Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
