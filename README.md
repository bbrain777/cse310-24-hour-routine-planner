# 24-Hour Routine Planner

## Overview

24-Hour Routine Planner is a React/Vite web application created for the CSE 310 Web Apps module. The purpose of the app is to help plan and track a full Saturday routine across Sleep, Work, Study, Family, Prayer, Reflection, and Personal Care.

The app starts with a default Saturday routine that totals exactly 24 hours. Users can add, edit, delete, complete, search, and filter routine blocks. It also calculates scheduled hours, completed hours, day progress toward 24 hours, open block count, and hours by category. Routine data is saved in browser local storage so the plan remains available after the page refreshes.

[Software Demo Video](https://youtu.be/ArTsHrJ5-w8)

## Development Environment

* Visual Studio Code
* Node.js
* Vite
* React
* JavaScript
* CSS
* Git and GitHub

## Useful Websites

* [React Documentation](https://react.dev/)
* [Vite Documentation](https://vite.dev/)
* [MDN Web Docs - Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
* [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)

## Future Work

* Add export/import for routine plans as JSON.
* Add optional start and end times for each routine block.
* Add a weekly routine view for comparing different days.
* Add charts for comparing scheduled hours and completed hours.

## Running the Program

Install dependencies:

```bash
npm.cmd install
```

Start the local development server:

```bash
npm.cmd run dev
```

Build the production version:

```bash
npm.cmd run build
```

## Module Requirements Demonstrated

* Built with React and Vite as a modern web app.
* Uses one main page with multiple interactive sections.
* Displays dynamically changing content based on user input.
* Uses React state, derived summary data, form handling, search, filters, and conditional rendering.
* Saves routine block data in browser local storage.
* Includes a default Saturday routine that totals exactly 24 scheduled hours.
* README is located at the root of the project and documents the software.
