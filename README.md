# Backflip

Backflip is a fairly designed web interface that allows you to enjoy AI role playing with no filtering or censorship

**Table of Contents**

1.  [Project Overview](#project-overview)
2.  [Architectural Specifications](#architectural-specifications)
    *   [Core Technologies](#core-technologies)
    *   [UI Components](#ui-components)
    *   [Data Management](#data-management)
3.  [Functionality Breakdown](#functionality-breakdown)
    *   [Character Handling](#character-handling)
    *   [Chat Interface Dynamics](#chat-interface-dynamics)
    *   [User Settings & Preferences](#user-settings--preferences)
4.  [Development Methodology](#development-methodology)
    *   [Coding Decisions](#coding-decisions)
    *   [Framework Absence](#framework-absence)
5.  [Future Considerations (Maybe)](#future-considerations-maybe)
6.  [Closing Remarks](#closing-remarks)

### 1. Project Overview

*   **Name:** *Backflip*
*   **Purpose:** To offer an uncensored non-biased neutral AI role playing experience.
*   **Disclaimer:** The project functions as designed.

### 2. Architectural Specifications

#### Core Technologies

*   **HTML5:** Used for semantic content structuring.
*   **CSS3:** For styling, with a dark theme, transitions, and CSS variables.
*   **JavaScript (ES6+):** Core logic is implemented in vanilla JavaScript.

#### UI Components

*   **Phosphor Icons:** Provides consistent UI icons.
*   **Modal Dialogs:** Manually constructed components.
*   **Chat Interface:** Dynamic message rendering.

#### Data Management

*   **Local Storage:** Browser's local storage is used for all data persistence.

### 3. Functionality Breakdown

#### Character Handling

*   JSON character objects are stored in local storage.
*   List of characters are rendered dynamically.

#### Chat Interface Dynamics

*   The chat interface renders messages as needed with JavaScript.
*   Message data is stored in local storage.
* User input is appended to the conversation history and sent to the AI model to get a response.

#### User Settings & Preferences

*   Settings and preferences are managed via local storage.
*   Logic for toggles, selects, and inputs is implemented.

### 4. Development Methodology

#### Coding Decisions

*   **Vanilla JavaScript:** No frameworks were used.
*   **Semantic HTML and CSS**: Implemented for structure and style.

#### Framework Absence

*   Frameworks were avoided to directly manage the DOM.

### 5. Future Considerations (Maybe)

*   **User Accounts:** Possible persistent data storage.
*   **UI Enhancements:** Possible future UI updates.

### 6. Closing Remarks

This document outlines the design of *Backflip*. The project has met the design goals and functions as intended.
