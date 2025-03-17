# My Blog - Backend

This is the backend of my personal blog, serving as the API for the blog. It handles blog post data, user authentication, and other server-side logic.

## Features
- **RESTful API**: Provides endpoints for fetching, creating, updating, and deleting blog posts.
- **User Authentication**: Integrates with Firebase for secure user authentication.
- **Database**: Uses Firebase Firestore or another database to store blog posts and user data.
- **Error Handling**: Robust error handling for API requests.

## Technologies Used
- **Node.js**: JavaScript runtime for building the backend.
- **Express.js**: Framework for creating the REST API.
- **Firebase**: For authentication and database management.
- **CORS**: To enable cross-origin requests from the frontend.
- **Dotenv**: For managing environment variables.

## How to Run
1. Clone this repository.
2. Install dependencies: `npm install`.
3. Create a `.env` file and add your Firebase credentials.
4. Start the server: `npm run dev`.
5. The API will be available at `http://localhost:8000`.

## Deployment
The backend is hosted on [Google Cloud Platform](https://cloud.google.com/) for scalability and reliability.

---

**Note**: This repository is part of a full-stack project. The frontend code can be found in the [fullstack-blog-frontend ](https://github.com/N-acker/fullstack-blog-frontend) repository.
