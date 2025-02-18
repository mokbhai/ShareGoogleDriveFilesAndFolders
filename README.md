# Project Name

## Description

This project is a web application built using Node.js and Express. It serves as a platform for managing files and folders, providing a user-friendly interface for file operations. The application utilizes EJS as the templating engine and supports environment variable management through dotenv.

## Features

- File and folder management
- Dynamic rendering of views using EJS
- Environment variable configuration
- Static file serving
- API routes for backend operations

## Technologies Used

- Node.js
- Express
- EJS
- dotenv
- Path and URL modules
- (Optional) CORS for cross-origin requests

## Installation

1. Clone the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables.

4. Get credentials.json from gcp and paste it in the root directory.

5. Start the application:

   ```bash
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`.

## Usage

- Access the main interface to view and manage files and folders.
- Click on folders to navigate and view their contents.
- Ensure that the `adminKey` is passed correctly in the URL for admin functionalities.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the contributors and the open-source community for their support.
