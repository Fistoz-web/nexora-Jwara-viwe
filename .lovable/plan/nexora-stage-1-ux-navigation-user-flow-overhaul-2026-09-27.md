# Nexora Stage 1 — UX, Navigation & User Flow Overhaul

This follows the Stage 1 document exactly. Nothing is rebuilt from scratch, and all working features stay: the real AI, sign-in, saved conversations, the Research Lab and file uploads.

## 1. Audit first
Before changing anything, check every area listed in the document (dashboard, sidebar, top bar, chat, Email, Research, Meetings, Tasks, Calendar, settings, profile, sign-in, history, empty states, buttons, pop-ups, mobile) against questions A–J. Fix the problems the check finds. No change is made just for looks.

## 2. Sidebar grouped by goal
Group the links as the document suggests, adjusted to the pages that exist today:
- **Home**
- **AI Workspace**: AI Chat, Recent Conversations
- **Work**: Email Studio, Meeting Intelligence, Tasks, Calendar
- **Research**: Research Lab, Documents, Saved Research
- **Personal**: Productivity, Saved Items
- **System**: Settings, Help

The document says to use a better structure if the app already has one, so each entry either opens a real page or jumps to the right part of an existing page. For example, Calendar opens the calendar view of Tasks, and Documents opens the Research documents panel. There will be no dead links.

## 3. A dashboard for starting work
- "Good morning, [Name]." with a large "What do you need help with today?" box. Its main button, **Ask Nexora**, sends your question straight to the real AI chat.
- Six example prompts that take you into the right feature: Draft an email, Analyse a document, Summarise meeting notes, Plan my day, Research a topic, Prepare for a meeting.
- Four quick actions: Write an Email, Analyse a Document, Summarise a Meeting, Plan My Day.
- **Recent Work**: your real recent conversations and research sessions, plus drafts, meetings and tasks where saved data exists. Every item opens where you left off. If a list is empty, you see a helpful empty message, not made-up items.

## 4. Every page answers three questions
Each page shows a title, a one-line description and one main button:
- Dashboard: **Ask Nexora**
- Chat: **Send**
- Research: **Start Research**
- Email: **Create Email**
- Meetings: **Analyse Meeting**
- Tasks: **Add Task**
- Calendar: **Create Event**

Other buttons are made visibly less prominent.

## 5. Fewer choices up front
- Research Lab: first ask "What would you like to do?" with four choices: Summarise, Analyse, Compare, Extract Actions. The detailed modes and depth settings appear only after you pick one. All existing modes stay.
- Apply the same approach in Email and Meetings.

## 6. Connected features
Next-step links pass the current content into the next feature:
- Research result: Create Email, Create Meeting Brief, Create Task
- Meeting summary: Draft Follow-up Email, Add Action Items to Tasks, Schedule Deadline
- Email: Create Follow-up Task
- Chat: Open in Email Studio
- Tasks: Schedule (on the calendar)

## 7. AI Chat starting screen
When a chat is empty, show "What can I help you with?" with five starters: Write, Understand, Research, Plan, Prepare. Clicking one fills the message box. It never creates a fake conversation.

## 8. Breadcrumbs only where they help
Only in deeper areas, such as Research Lab > My Research > [Session] > Document Analysis.

## 9. Clear button wording and feedback
- Replace vague labels (Submit, Generate, Process, Continue) with labels that say what happens, like Create Email, Analyse Document or Humanize Text.
- Show clear status messages: "Nexora is thinking...", "Uploading document...", "Analysing document...", "Saved", "Email sent", and "Something went wrong. Try again."

## 10. Helpful empty screens
Chat, Email, Meetings, Tasks, Calendar, Documents and Research each get a short explanation, one main button and one or two example actions.

## 11. Mobile
- A bottom bar for main navigation on phones, with the grouped menu in a slide-out panel.
- Main buttons stay visible and secondary controls fold away.
- Easy-to-use chat box and pop-ups that fit the screen.
- Touch targets at least 44px and no sideways scrolling.

## 12. Calmer look
Less glass effect, glow and gradient. Fewer AI icons and rounded boxes. Clear differences in importance between headings, main buttons and supporting text. The same color scheme stays.

## 13. Final check
Walk through the six test scenarios in the running app: write an email, understand a PDF, turn meeting notes into actions, ask for help, come back the next day, and continue after research. Fix anything that still requires guessing. Then do a final review as a first-time user.

## Technical details
- `Shell.tsx` gets grouped navigation, a mobile bottom bar and a shared `PageHeader` (title, description, main button, optional breadcrumbs). All routes use it.
- New route files for sidebar entries without a real page yet (`/chat`, `/settings`, `/help`, `/saved`, `/productivity`) reuse the existing data and components. Calendar, Documents and Saved Research link to existing views through search parameters (for example `/tasks?view=calendar`, `/research?panel=documents`).
- Content moves between features through route search parameters or sessionStorage, e.g. `/email?draft=...&source=research`, and the receiving page fills itself in. No database changes.
- Recent Work reads the existing chat and research data through the current server functions. Each list shows its empty state when there is no data.
- A small ChatbotOverlay API lets other pages open the chat with a prompt already filled in.
- The AI endpoints, sign-in and saved data are not changed.
