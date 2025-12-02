# Project Scope Document: Electrical Safety Audit Report Generator

## 1. Project Overview
**Project Name:** Electrical Safety Audit Application
**Client:** Sustenergy Foundation
**Objective:** To develop a responsive, web-based application that enables field engineers to digitally record electrical safety audit data and instantly generate professional, standardized Microsoft Word (.docx) reports.

## 2. Functional Requirements

### 2.1 Data Collection Modules
The application features a structured, multi-section form to capture comprehensive audit details:

*   **General Information:**
    *   Capture Branch Name, Branch Code, Reference Number.
    *   Record Report Date and Inspection Date.
    *   Client Name input.
*   **General Observations:**
    *   Free-text area for recording broad site observations and notes.
*   **Visual Documentation (Snapshots):**
    *   **Image Upload:** Ability to upload site photos directly from a device (camera or gallery).
    *   **Description:** dedicated text field for describing the issue or observation for each photo.
    *   **Dynamic List:** Users can add or remove an unlimited number of snapshot entries.
*   **Power Parameters:**
    *   Structured data entry for electrical measurements.
    *   **Voltage:** Line Voltage (RY, YB, BR), Phase Voltage (R-N, Y-N, B-N), and Neutral-Earth Voltage.
    *   **Current:** Amperage readings for R, Y, B phases and Neutral.
    *   **Quality:** Frequency and Power Factor inputs.
*   **Connected Load Management:**
    *   **Dynamic Table:** Add/Remove load items (e.g., Lights, ACs, Fans).
    *   **Auto-Calculation:** Automatically calculates Sub-total (KW) based on Power (W) and Quantity.
    *   **Grand Total:** Automatically sums up the Total Connected Load (KW) for the facility.
*   **Conclusions:**
    *   Dynamic list to add multiple concluding remarks and recommendations.

### 2.2 Report Generation
*   **Format:** Generates a standard Microsoft Word (`.docx`) file.
*   **Processing:** Client-side generation (no internet required for generation once loaded).
*   **Layout & Formatting:**
    *   Professional Header with Branch Name and Code.
    *   Formatted tables with fixed column widths for readability.
    *   Embedded images properly resized and aligned.
    *   Standardized Footer with signatory details (Principal Consultant credentials).
*   **File Naming:** Auto-generates filenames based on the Branch Name (e.g., `Audit_Report_Downtown_Branch.docx`).

## 3. User Interface & Experience (UI/UX)
*   **Design Theme:** "Gemini-inspired" aesthetic featuring a clean white background with vibrant, color-coded sections for better visual distinction:
    *   Blue: General Info
    *   Green: Observations
    *   Purple: Snapshots
    *   Orange: Power Parameters
    *   Pink: Connected Load
    *   Teal: Conclusions
*   **Responsiveness:** Fully responsive layout that adapts to:
    *   **Desktop:** Multi-column grid layout.
    *   **Mobile:** Single-column layout with touch-friendly inputs.
*   **Sticky Action Bar:** A "Generate Report" button fixed to the bottom of the screen for easy access on long forms.

## 4. Technical Specifications
*   **Framework:** Next.js (React)
*   **Language:** JavaScript / JSX
*   **Styling:** Custom CSS with CSS Variables for theming.
*   **Core Libraries:**
    *   `docx`: For programmatic Word document generation.
    *   `file-saver`: For handling client-side file downloads.
    *   `lucide-react`: For modern UI icons.
*   **Deployment Model:** Static Web Application (can be hosted on any standard web server without backend requirements).

## 5. Deliverables
*   Complete Source Code.
*   Build artifacts (ready-to-deploy static files).
*   Documentation on how to run and deploy the application.
