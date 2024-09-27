# AI Story Narration

AI Story Narration is an interactive web application that uses artificial intelligence to generate, illustrate, and narrate children's stories. This project leverages OpenAI's GPT and DALL-E models to create unique, engaging stories with accompanying images and audio narration.

## Features

- Generate custom children's stories based on user input
- Create AI-generated illustrations for the stories
- Produce audio narrations of the stories
- Save and manage a library of generated stories
- Preview and edit generated content

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- An OpenAI API key
- An ElevenLabs API key (optional, for high-quality voice generation)

## Installation

1. Clone the repository:
   ```
   https://github.com/elberacasa/story-creator.git
   ```

2. Navigate to the project directory:
   ```
   cd ai-story-narration
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your API keys:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

## Usage

1. Start the development server:
   ```
   npm start
   ```

2. Open your browser and visit `http://localhost:3000`

3. Follow the on-screen instructions to generate, illustrate, and narrate your story

## Contributing

Contributions to the AI Story Narration project are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

If you have any questions or feedback, please open an issue on the GitHub repository.

## Acknowledgements

- [OpenAI](https://openai.com/) for providing the GPT and DALL-E models
- [ElevenLabs](https://elevenlabs.io/) for the text-to-speech API
- [React](https://reactjs.org/) for the frontend framework

Happy storytelling!
