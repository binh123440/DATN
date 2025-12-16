# copilot-instructions.md

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a React.js social media platform called "UTE Social" designed for university students. The platform includes:

- Social media features similar to Facebook (posts, groups, chat)
- Event creation and management system
- QR code-based attendance tracking for events
- Points/rewards system for student engagement
- Automatic vending machine integration using earned points

## Technology Stack
- React.js with Vite
- Tailwind CSS for styling (minimal custom CSS preferred)
- Lucide React for icons
- React Router for navigation
- QRCode.js for generating QR codes
- QRCode-reader for scanning QR codes

## Code Style Guidelines
- Use functional components with hooks
- Prefer Tailwind utility classes over custom CSS
- Keep components modular and reusable
- Use descriptive variable and function names in Vietnamese context where appropriate
- Follow React best practices for state management

## Key Features to Maintain
- Event posting with QR code generation for attendance
- Points accumulation system
- Clean, modern UI following the provided design mockup
- Mobile-responsive design
- Real-time-like interactions

## Vietnamese Context
- All user-facing text should be in Vietnamese
- UI elements should follow Vietnamese conventions
- Consider Vietnamese educational system context (university structure, student activities)
# Copilot Instructions — UTE Social (monorepo)

Short: This workspace is a two-app monorepo: a Vite React frontend (`client/`) and an Express + Sequelize backend (`server/`). The frontend calls backend APIs at `VITE_API_URL` (default http://localhost:5000/api). Follow the examples below when adding endpoints, UI pieces, or fixes.

1) Repo layout & entry points
- Frontend: [client/package.json](client/package.json) — Vite React app. Dev: `cd client && npm install && npm run dev`.
- Backend: [server/package.json](server/package.json) — Express + Socket.IO + Sequelize (Postgres). Dev: `cd server && npm install && npm run dev`.
- Server entry: [server/server.js](server/server.js) — mounts routes under `/api/*` and configures Socket.IO.

2) Environment & database
- Copy [server/.env.example](server/.env.example) -> [server/.env](server/.env) and set `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`.
- DB: Sequelize + `pg` (Postgres). Models are in `server/src/models` and exported from `server/src/models/index.js`.

3) Key conventions to follow (project-specific)
- Vietnamese names: code and API fields often use Vietnamese (e.g., `su-kien`, `bai-viet`, `id_nguoi_dung`). Keep naming consistent with existing endpoints.
- API envelope: controllers consistently return JSON shaped like `{ success: boolean, message: string, data?: any }`. Follow this pattern for new endpoints.
- Controllers use Sequelize transactions for multi-step operations (see [server/src/controllers/suKienController.js](server/src/controllers/suKienController.js#L1)). Use `await sequelize.transaction()` when making multiple related DB changes.
- Route ordering matters: some route files include a warning to place specific/static routes before dynamic param routes (see [server/src/routes/suKienRoutes.js](server/src/routes/suKienRoutes.js)). Respect that ordering when adding routes.

4) Auth, roles, and sockets
- JWT auth middleware: `xacThucToken` in [server/src/middleware/dangNhapMiddleware.js](server/src/middleware/dangNhapMiddleware.js). Role check helper: `kiemTraVaiTro(role1, role2)`.
- Socket.IO expects a JWT passed as `socket.handshake.auth.token` (see [server/server.js](server/server.js#L1)). Ensure frontend sends the token on socket connect.

5) Frontend ↔ Backend integration patterns
- API client: [client/src/services/apiService.js](client/src/services/apiService.js) creates an Axios `apiClient` that injects the `Authorization` header from `localStorage.token` and uses `VITE_API_URL`.
- When adding a new endpoint: (1) add route in `server/src/routes/*`, (2) implement controller in `server/src/controllers/*`, (3) update `client/src/services/apiService.js` with a helper function, (4) use the helper in a React component under `client/src/components/`.

6) File locations that show canonical patterns (use as examples)
- Routes: [server/src/routes/suKienRoutes.js](server/src/routes/suKienRoutes.js)
- Controller examples with transactions & notifications: [server/src/controllers/suKienController.js](server/src/controllers/suKienController.js)
- API client + interceptors: [client/src/services/apiService.js](client/src/services/apiService.js)
- Cloudinary uploads configuration: [server/src/config/cloudinary.js](server/src/config/cloudinary.js)

7) Developer workflows & helpful commands
- Start frontend: `cd client && npm install && npm run dev` (default Vite port 5173).
- Start backend: `cd server && npm install && npm run dev` (nodemon on port 5000).
- Health check: `GET /api/health` on the backend shows env info and Cloudinary status ([server/server.js](server/server.js#L1)).
- To run both locally, open two terminals and start client + server individually.

8) Tests, linting, and CI
- There are no automated tests in this repo. Linting is available for the client via `npm run lint` in `client/`.

9) When making changes, keep them minimal and consistent
- Preserve Vietnamese naming and API shapes.
- Add unit tests only when fixing complex logic; otherwise prefer integration testing manually and document the change.

10) Quick checklist for Copilot PRs
- Does the backend route follow existing patterns (route -> controller -> model)?
- Does the controller return the `{ success, message, data }` envelope and handle errors with 500/4xx and logs?
- If DB writes span multiple models, use transactions and rollback on error.
- If adding file uploads, use Cloudinary config and `multer` integrations in `server/src/middleware/upload.js`.

If any area above is unclear or you'd like snippets/examples added (e.g., a sample route + controller + client helper), say which part and I will extend this file.