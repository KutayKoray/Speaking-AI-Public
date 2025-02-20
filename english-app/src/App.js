import { useEffect, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, RotateCw, AlertCircle, Volume2, VolumeX } from 'react-feather';
import './App.css';

function App() {
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastTranscriptRef = useRef('');
  const isProcessingRef = useRef(false);
  
  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startSpeaking = (text) => {
    stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setError('Speech synthesis failed');
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      const initUtterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(initUtterance);
      
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US'
      });
    }
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setAiResponse("");
    setError(null);
    stopSpeaking();
    lastTranscriptRef.current = '';
    isProcessingRef.current = false;
  };
  
  const base64ToBlob = (base64) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: 'audio/wav' });
  };

  useEffect(() => {
    if (!listening && 
        transcript && 
        transcript !== lastTranscriptRef.current && 
        !isProcessingRef.current) {
      lastTranscriptRef.current = transcript;
      isProcessingRef.current = true;
      handleConversation(transcript);
      resetTranscript();
    }
  }, [listening, transcript]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleConversation = async (userInput) => {
    if (!userInput.trim()) {
      isProcessingRef.current = false;
      return;
    }
  
    setIsLoading(true);
    stopSpeaking();
    
    try {
      const response = await fetch('https://kutaykoray.me/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput })
      });
      
      const { aiText } = await response.json();
      setAiResponse(aiText);
      startSpeaking(aiText);
    
    } catch (err) {
      setError(err.toString());
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="error">Tarayıcınız konuşma tanımayı desteklemiyor!</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>AI English Tutor</h1>
        <p>Practice your English speaking skills with AI</p>
      </div>

      <div className="main-content">
        <div className="voice-section">
          <button 
            className={`mic-button ${listening ? 'active' : ''}`}
            onClick={toggleListening}
          >
            {listening ? (
              <MicOff size={24} className="icon" />
            ) : (
              <Mic size={24} className="icon" />
            )}
            <span>{listening ? 'Stop Recording' : 'Start Recording'}</span>
          </button>

          <button 
            className="clear-button"
            onClick={handleClearTranscript}
          >
            Clear Transcript
          </button>
          <br/><br/>

          <div className="transcript-box">
            <div className="section-header">
              <h3>Your Speech</h3>
              <div className="status-indicator">
                {listening && <div className="pulse"></div>}
                {listening ? 'Listening...' : 'Ready'}
              </div>
            </div>
            <p className="transcript-text">
              {transcript || "Start speaking to see the transcript..."}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="loading-section">
            <RotateCw className="spinner" />
            <p>Generating AI response...</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <AlertCircle className="error-icon" />
            <div>
              <h3>Something went wrong!</h3>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => handleConversation(transcript)}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {aiResponse && (
          <div className="response-section">
            <div className="section-header">
              <h3>AI Response</h3>
              <div className="ai-label">
                AI Tutor
                <button 
                  className={`speak-button ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() => isSpeaking ? stopSpeaking() : startSpeaking(aiResponse)}
                  style={{ 
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '8px',
                    padding: '5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: isSpeaking ? '#4CAF50' : 'inherit'
                  }}
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>
            <div className="response-bubble">
              <p>{aiResponse}</p>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>Tips: Speak clearly and try to use complete sentences</p>
      </div>
    </div>
  );
}

export default App;