# Backend
[![CI](https://github.com/project-orbital/backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/project-orbital/backend/actions/workflows/node.js.yml)

This repository contains the backend of our application, DollarPlanner.

`master` is the stable branch, and should work with the corresponding `master`
branch of the frontend.

`dev` is the main development branch, which may be unstable and buggy.
It is not guaranteed to work with the frontend, especially if frontend changes have
not been merged.

`x-<feature name>` branches are topic branches for specific feature development.

## Developer Setup

### System requirements
1. [Node.js](https://nodejs.dev/download/) 18.0.0 or higher
2. [MongoDB](https://www.mongodb.com/) Cloud account

### Setting up your local environment
1. Clone the repository to your local machine.

    ```
    cd <clone location>
    git clone https://github.com/project-orbital/backend
    ```

2. Install the NodeJS dependencies.

    ```
    cd backend
    npm install
    ```

3. Get the URI to your MongoDB database. It should look similar to the following:

    ```
    mongodb+srv://<username>:<password>@cluster0-qjvjg.mongodb.net/test?retryWrites=true&w=majority
    ```

4. Set up the development secrets by replacing the values in `.env`.

    ```
    cp .env.example .env
    vim .env
    ```

5. Start the server on your local machine.

    ```
    nodemon server
    ```

6. Open a new tab in your browser and navigate to http://localhost:4000.
   If the [frontend](https://github.com/project-orbital/frontend) is up and running, you should be able to sign up at http://localhost:3000/sign-up and sign in at http://localhost:3000/sign-in.
