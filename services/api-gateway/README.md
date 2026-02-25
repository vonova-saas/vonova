# 🚀 Vonova API Gateway

> **The Central Nervous System of Vonova**  
> A powerful, secure, and intelligent API Gateway built with NestJS that orchestrates all microservices under one unified entry point.

---

## ✨ What is This?

Imagine a **masterful conductor** 🎼 leading a symphony of microservices, or a **brilliant traffic controller** 🚦 managing the digital highways of your application. The Vonova API Gateway is exactly that – your intelligent orchestrator that:

- 🎯 **Routes with Precision** - Like a GPS that never gets lost, intelligently directing every request to its perfect destination
- 🔐 **Guards the Gates** - A digital bouncer that knows who's who, ensuring only the right people get through
- 💫 **Transforms on the Fly** - A shape-shifting middleware that adapts requests and responses in real-time
- 🌊 **Flows Like Water** - Seamlessly connecting services like rivers flowing into an ocean of functionality

Built with NestJS, this gateway isn't just code – it's the **beating heart** 💓 of the Vonova ecosystem, pumping data, requests, and responses through every microservice with grace and precision.

---

## 🎯 Key Features

| Feature                       | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 🔐 **JWT Authentication**     | Your digital passport system – secure token-based authentication that auto-refreshes like a renewable visa                             |
| 🌐 **OAuth2 Integration**     | One-click magic ✨ – seamless Google OAuth2 login that makes authentication feel like teleportation                                    |
| 🔄 **Smart Request Proxying** | The ultimate request translator 🗣️ – intelligently routes to microservices while preserving every bit of context like a perfect memory |
| 💓 **Health Monitoring**      | The digital doctor 👨‍⚕️ – real-time service health checks that pulse through your infrastructure like a heartbeat                        |
| 📚 **Swagger Documentation**  | Your interactive API playground 🎮 – explore, test, and understand your APIs with beautiful, live documentation                        |
| 🛡️ **Security Stack**         | An impenetrable fortress 🏰 – comprehensive middleware that guards, validates, and protects like a digital army                        |

---

## 🚦 Quick Start

### Installation

```bash
# Choose your weapon of choice ⚔️
npm install
# or
bun install
```

> 💡 **Pro Tip**: Both package managers work like a charm! Pick your favorite and let's get this party started! 🎉

### Running the Application

```bash
# 🛠️ Development Mode (with hot-reload magic ✨)
npm run dev
# or
bun run dev

# 🏭 Production Mode (time to shine! 🌟)
npm run build
npm run start:prod
```

> 🚀 **Ready to launch?** The gateway will come alive and start orchestrating your microservices like a maestro! 🎼

---

## 📁 Project Architecture

```
src/
├── 🚪 main.ts                 # The grand entrance – where the magic begins ✨
├── 🧩 app.module.ts            # The master blueprint – orchestrating all modules
├── 📦 modules/                 # Feature modules (the building blocks 🧱)
│   ├── 🔐 auth/                # The security fortress – authentication & authorization
│   └── 🌉 gateway/             # The bridge builder – gateway & proxy logic
├── 🔧 common/                  # The shared toolbox – utilities & cross-cutting concerns
│   ├── 🛡️ guards/              # The sentinels – protecting routes like digital knights
│   ├── 🚨 filters/             # The safety nets – catching exceptions gracefully
│   ├── 🔄 middleware/          # The transformers – shaping requests & responses
│   └── 🎮 controllers/         # The command center – health checks & status reports
├── 📊 models/                  # The data architects – Mongoose schemas & data models
└── ⚙️ config/                  # The control panel – configuration & environment setup
```

> 🏗️ **Architecture Insight**: Each folder is a carefully crafted piece of the puzzle, working together to create a seamless, powerful gateway experience!

---

## 🗺️ API Routes Map

> 🧭 **Your Navigation Guide**: Explore the digital landscape of Vonova's API Gateway. Every route is a journey, and we're here to guide you! 🗺️

### 🔐 Authentication Hub (`/auth`)

The **security command center** 🛡️ – where identities are verified, tokens are born, and access is granted. All authentication flows are handled directly by the gateway with military precision:

| Method | Endpoint                      | Purpose                       |
| ------ | ----------------------------- | ----------------------------- |
| `POST` | `/auth/register`              | 🆕 Create a new user account  |
| `POST` | `/auth/verify-email`          | ✉️ Verify email address       |
| `POST` | `/auth/login`                 | 🔑 User login                 |
| `POST` | `/auth/welcome-email-user`    | 👋 Complete registration flow |
| `GET`  | `/auth/google`                | 🌐 Initiate Google OAuth      |
| `GET`  | `/auth/google/callback`       | 🔄 Handle OAuth callback      |
| `GET`  | `/auth/refresh`               | ♻️ Refresh access token       |
| `POST` | `/auth/logout`                | 🚪 Logout current session     |
| `POST` | `/auth/logout-all`            | 🚪🚪 Logout from all devices  |
| `GET`  | `/auth/currentUser`           | 👤 Get current user info      |
| `POST` | `/auth/request-resetPass`     | 🔑 Request password reset     |
| `POST` | `/auth/verify-resetPass-code` | ✅ Verify reset code          |
| `POST` | `/auth/reset-password`        | 🔄 Reset password             |

---

### 📱 App Service Routes (`/app/*`)

The **user experience layer** 🎨 – proxied seamlessly to the app service like a teleportation portal:

- **Settings** → `/app/settings/*` - 🎛️ Your personal control panel – customize your experience
- **Account** → `/app/account/*` - 👤 Your digital identity hub – manage your presence
- **Billing** → `/app/billing/*` - 💳 The payment portal – where subscriptions come to life
- **Support** → `/app/support/*` - 🎧 Your help desk – get assistance when you need it
- **Feedback** → `/app/feedback/*` - 💬 Your voice matters – share your thoughts and ideas

---

### 🎓 LMS Service Routes (`/api/v1/lms/*`)

The **knowledge universe** 📚 – proxied to the Learning Management System where education meets innovation:

- **Courses** → `/api/v1/lms/courses/*` - 📖 The course catalog – your gateway to knowledge
- **Quizzes** → `/api/v1/lms/quizzes/*` - 🧠 The challenge arena – test your understanding
- **Library** → `/api/v1/lms/library/*` - 📚 The digital library – books, guides, and presentations at your fingertips
- **Assignments** → `/api/v1/lms/assignments/*` - 📝 The task manager – organize and submit your work
- **Enrollment** → `/api/v1/lms/enroll/*` - 🎫 The enrollment portal – join courses with a click
- **Progress** → `/api/v1/lms/progress/*` - 📈 The progress tracker – watch your learning journey unfold

---

### 🤖 LMS-AI Service Routes

The **AI-powered learning companion** 🤖 – where artificial intelligence meets education to create magical experiences:

#### 🗺️ Roadmap Routes (`/roadmap/*`)

Your **personalized learning GPS** 🧭 – AI-generated roadmaps that guide your educational journey:

| Method   | Endpoint                               | Description                                                            |
| -------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `POST`   | `/roadmap/generate`                    | 🎯 Create your personalized AI learning roadmap – your path to mastery |
| `GET`    | `/roadmap/:roadmapId/:userId`          | 📋 Retrieve your custom roadmap – your learning blueprint              |
| `PUT`    | `/roadmap/:roadmapId/progress/:userId` | 📈 Update your progress – mark milestones and celebrate wins           |
| `GET`    | `/roadmap/:userId`                     | 📚 Get all your roadmaps – see your entire learning journey            |
| `DELETE` | `/roadmap/:roadmapId/:userId`          | 🗑️ Delete a roadmap – clean up when needed                             |
| `GET`    | `/roadmap/health`                      | 💓 Service health check (public) – ensure the AI is alive and well     |

#### 📄 PDF Summary Routes (`/pdf-summary/*`)

The **document intelligence center** 📄 – transform PDFs into interactive learning experiences:

| Method   | Endpoint                                       | Description                                             |
| -------- | ---------------------------------------------- | ------------------------------------------------------- |
| `POST`   | `/pdf-summary/upload`                          | 📤 Upload your PDF – let AI work its magic              |
| `POST`   | `/pdf-summary/chat`                            | 💬 Chat with your PDF – ask questions, get answers      |
| `GET`    | `/pdf-summary/summarize`                       | 📝 Get instant summaries – distill knowledge in seconds |
| `GET`    | `/pdf-summary/session/:sessionId/chat-history` | 📜 Retrieve chat history – never lose a conversation    |
| `DELETE` | `/pdf-summary/session/:sessionId`              | 🗑️ Delete session – clear the slate                     |
| `GET`    | `/pdf-summary/health`                          | 💓 Service health check (public) – verify AI readiness  |

---

### 🏥 Health & Monitoring Routes

The **digital wellness center** 🏥 – keep your finger on the pulse of the entire system:

| Endpoint               | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `GET /`                | 🏠 Gateway status & welcome – your first hello from the gateway     |
| `GET /services`        | 📋 List all registered services – see who's in the orchestra        |
| `GET /services/status` | 📊 Health status of all services – the complete system vitals       |
| `GET /health`          | 💓 Overall platform health check (public) – the heartbeat of Vonova |

---

## 🔧 Environment Configuration

### Required Variables

```env
# Server Configuration
PORT=4000                          # Gateway port
NODE_ENV=development              # Environment mode

# Database
MONGO_URI_REMOTE=mongodb://...    # MongoDB connection string

# Security
JWT_ACCESS_SECRET=your-secret     # JWT access token secret
JWT_REFRESH_SECRET=your-secret    # JWT refresh token secret
GATEWAY_SIGNING_SECRET=your-secret # Auth context signing secret
INTERNAL_API_SECRET_KEY=your-key  # Internal API secret

# Service URLs
APP_SERVICE_URL=http://...        # App service endpoint
LMS_SERVICE_URL=http://...        # LMS service endpoint
LMS_AI_SERVICE_URL=http://...     # LMS-AI service endpoint
ROADMAP_AI_SERVICE_URL=http://127.0.0.1:5000      # Roadmap AI service (default)
PDF_SUMMARY_AI_SERVICE_URL=http://127.0.0.1:5015  # PDF Summary AI service (default)
```

---

## 🔐 Authentication Flow

The gateway implements a **sophisticated authentication ballet** 🩰 – a choreographed dance of security and trust:

1. **🔍 Token Validation** - The gatekeeper checks your credentials – validates JWT tokens from HTTP-only cookies like a bouncer checking IDs
2. **👤 Context Attachment** - Your identity gets attached – user context seamlessly woven into every request like a digital signature
3. **✍️ Signed Forwarding** - The secure handoff – signs and forwards auth context to downstream services with cryptographic precision
4. **♻️ Auto Refresh** - The renewal magic – handles token refresh automatically, keeping you logged in without interruption

> 💡 **Security Note**: Most routes require JWT authentication – think of it as a VIP pass to the Vonova ecosystem. Public routes (like health checks) are explicitly marked and open to all! 🎫

---

## 🔍 Service Discovery & Monitoring

The gateway features **intelligent service discovery** – like having a GPS for your entire microservices ecosystem:

- 🔄 **Automatic Discovery** - The digital explorer – automatically discovers all registered microservices like a scout mapping new territory
- 💓 **Health Monitoring** - The pulse monitor – performs periodic health checks, ensuring every service is alive and kicking
- 📊 **Status Tracking** - The real-time dashboard – maintains live service availability status like a control tower monitoring flights
- 🚨 **Failure Detection** - The alert system – identifies and reports service failures before they become problems, like a smoke detector for your infrastructure

---

## 🎨 Built With

The **tech stack that powers the magic** ✨:

- **NestJS** - 🏗️ The progressive Node.js framework – building scalable architectures with elegance
- **TypeScript** - 🛡️ Type-safe development – catching bugs before they catch you
- **Mongoose** - 🍃 MongoDB object modeling – bridging the gap between code and data
- **JWT** - 🔐 Secure token-based authentication – the keys to the kingdom
- **Swagger** - 📚 API documentation – making APIs speak human language

---

## 📝 License

Part of the **Vonova project ecosystem** – a constellation of microservices working in perfect harmony. 🌌

---

## 🎉 Ready to Build?

You're now equipped with everything you need to understand, deploy, and extend the Vonova API Gateway. Whether you're routing requests, securing endpoints, or monitoring services, remember: **every line of code is a step toward building something amazing!** 🚀

---

**Made with ❤️, ☕, and lots of 🎨 creativity for Vonova**

> 💫 _"In the world of microservices, the gateway is the bridge that connects everything – and this one is built to last."_
