"use client";

import { useState } from 'react';

export default function ContentPage() {
  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!image || !prompt) {
      setErrorMessage('Please provide both an image and a prompt.');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: base64Image, prompt }),
        });

        const data = await response.json();

        let interval = setInterval(() => {
          setProgress((prev) => {
            if (prev && prev < 100) return prev + 10;
            clearInterval(interval);
            return 100;
          });
        }, 600);

        if (response.ok) {
          setVideoUrl(data.videoUrl);
        } else {
          setErrorMessage(data.message || 'Error generating video.');
        }
      };
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to generate video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Generate a Video from Image and Prompt</h1>

      <section className="instructions">
        <h2>How it Works</h2>
        <p>
          Upload an image and enter a descriptive prompt. Our AI will generate a custom video based on your input!
        </p>
      </section>

      <form onSubmit={handleSubmit} className="video-form">
        <div className="form-group">
          <label htmlFor="image">Upload Image (Max 5MB):</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
            disabled={loading}
          />
          {image && (
            <div className="image-preview">
              <p>Image Preview:</p>
              <img src={URL.createObjectURL(image)} alt="Image preview" width="200" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="prompt">Video Prompt:</label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading || !image || !prompt}>
          {loading ? 'Generating Video...' : 'Generate Video'}
        </button>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {loading && progress !== null && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </form>

      {videoUrl && (
        <section className="video-result">
          <h2>Generated Video</h2>
          <p>Your video is ready!</p>
          <video width="600" controls>
            <source src={videoUrl} type="video/mp4" />
          </video>
        </section>
      )}

      <section className="additional-info">
        <h2>Tips for Better Results</h2>
        <ul>
          <li><strong>Be specific:</strong> Detailed prompts work best.</li>
          <li><strong>High-quality images:</strong> Clear photos improve output.</li>
          <li><strong>Patience:</strong> Video generation may take a few moments.</li>
        </ul>
      </section>

      <section className="faq">
        <h2>Frequently Asked Questions</h2>
        <dl>
          <dt>What’s the max image size?</dt>
          <dd>Up to 5MB.</dd>

          <dt>How long does it take?</dt>
          <dd>A few minutes depending on complexity.</dd>

          <dt>What formats are supported?</dt>
          <dd>JPG, PNG, and GIF.</dd>
        </dl>
      </section>

      <footer>
        <p>© 2025 Video Generation Service. All Rights Reserved.</p>
      </footer>

      {/* INLINE STYLE BELOW */}
      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 25px;
          font-family: Arial, sans-serif;
        }

        h1 {
          font-size: 2rem;
          text-align: center;
          margin-bottom: 20px;
        }

        h2 {
          margin-top: 25px;
          font-size: 1.6rem;
        }

        .form-group {
          margin-bottom: 18px;
        }

        input[type="text"],
        input[type="file"] {
          width: 100%;
          padding: 12px;
          margin-top: 6px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }

        button {
          padding: 12px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        button:disabled {
          background-color: #bcbcbc;
          cursor: not-allowed;
        }

        .error-message {
          color: red;
          margin-top: 12px;
        }

        .progress-bar {
          margin-top: 15px;
          width: 100%;
          background: #ddd;
          border-radius: 10px;
          height: 20px;
        }

        .progress {
          background: #4CAF50;
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .image-preview {
          margin-top: 10px;
        }

        .faq dt {
          font-weight: bold;
          margin-top: 15px;
        }

        footer {
          margin-top: 40px;
          text-align: center;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
