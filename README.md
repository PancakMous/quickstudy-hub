# QuickStudy Hub

Build a modern, clean, and functional web app called QuickStudy.

App Purpose

QuickStudy is a learning app that helps students study different subjects using flashcards and quizzes. For the first version, the main focus should be History, with history questions and flashcards.

The app should be genuinely useful for students, not just a visual demo.

Main Features

1. Home Page

Create a welcoming homepage with:

App name: QuickStudy

A short description: “Learn faster with flashcards and quizzes.”

A section called My Subjects

Display available subjects, starting with:

History

A Create New Subject button

When the user clicks on a subject, they should be able to access study options for that subject.

For now, History should include preloaded content so the app can be tested immediately.

2. Flashcards Page

Create an interactive flashcard study page.

Each flashcard should contain:

A question on the front

An answer on the back

A button or click interaction to flip the card

Previous and Next buttons

A progress indicator showing which card the user is studying

Example:

Question:
“When did World War II end?”

Answer:
“1945”

Include several preloaded History flashcards covering topics such as:

World War I

World War II

Ancient Egypt

Ancient Rome

Important historical figures

Major historical events

Also include the ability to add new flashcards with:

Question

Answer

3. Quiz Page

Create a multiple-choice History quiz.

The quiz should:

Display one question at a time

Have 4 answer choices

Allow the user to select one answer

Show progress, for example: “Question 2 of 5”

Include Next and Previous buttons where appropriate

Show the final score after the quiz is completed

Example:

When did World War II end?

A. 1918
B. 1939
C. 1945
D. 1950

The correct answer should be stored and the score should be calculated correctly.

Start with at least 5–10 History questions.

4. Progress Page

Create a Progress page that tracks learning progress.

Display:

Flashcards completed/studied

Total flashcards

Last quiz score

Best quiz score

Quiz completion percentage

Include visual progress bars or simple statistics.

Example:

Flashcards Studied: 8 / 10

Last Quiz Score: 4 / 5

Best Score: 90%

Navigation

Create a simple navigation menu with:

Home

Flashcards

Quiz

Progress

The navigation should work correctly between all pages.

Design

Use a clean, modern, student-friendly design.

Requirements:

Simple and easy to understand

Responsive for desktop and mobile

Modern cards and buttons

Good spacing

Clear typography

History/education-inspired design

Do not make the design overly complicated

Use a professional color scheme suitable for an educational app.

Functionality

Make the app functional, not just a static design.

Users should be able to:

Open the Home page

Select History

Study History flashcards

Flip flashcards

Move between flashcards

Take a History quiz

Select answers

Complete the quiz

See their final score

View their progress

Store progress locally so it remains available when the user navigates around the app.

Build Priority

Build the application in this order:

Navigation and Home page

History subject

Flashcards functionality

Quiz functionality

Score calculation

Progress tracking

Start by creating the full application structure and functional History content. Use preloaded sample History questions and flashcards so the app is immediately usable and testable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a145454b-52ad-4ca7-bbdc-e3cc1f9a6eb1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
