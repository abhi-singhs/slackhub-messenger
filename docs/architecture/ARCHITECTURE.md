# SlackHub Messenger - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [Authentication Flow](#authentication-flow)
7. [Real-time Data Flow](#real-time-data-flow)
8. [Component Architecture](#component-architecture)
9. [State Management](#state-management)
10. [Technology Stack](#technology-stack)
11. [Deployment Architecture](#deployment-architecture)

## Overview

SlackHub Messenger is a modern, real-time chat application that provides Slack-like functionality with channels, direct messaging, file sharing, and rich text editing. The application is built using a serverless architecture with Supabase as the backend-as-a-service provider.

### Key Features
- Real-time messaging with threading support
- Channel and direct message management
- File attachments with preview
- Keyboard shortcuts and accessibility features
- Emoji reactions and rich text editing
- User status management
- Multiple authentication methods
- Responsive design with theming support

## System Architecture

```mermaid
graph TB
    subgraph "Client Side"
        A[React Frontend] --> B[Vite Build Tool]
        A --> C[Tailwind CSS]
        A --> D[Radix UI Components]
        A --> E[TipTap Editor]
    end
    
    subgraph "Backend Services"
        F[Supabase] --> G[PostgreSQL Database]
        F --> H[Authentication Service]
        F --> I[Real-time Engine]
        F --> J[Storage Service]
        F --> K[Edge Functions]
    end
    
    subgraph "Real-time Features"
        L[WebSocket Connections]
        M[WebRTC for Calls]
        N[Live Data Sync]
    end
    
    subgraph "External Services"
        O[GitHub OAuth]
        P[CDN/Storage]
    end
    
    A --> F
    F --> L
    A --> M
    H --> O
    J --> P
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style G fill:#e8f5e8
```

## Frontend Architecture

```mermaid
graph TD
    subgraph "React Application"
        A[App.tsx] --> B[ErrorFallback]
        A --> C[AuthComponent]
        A --> D[Main UI Components]
        
        D --> E[Header]
        D --> F[Sidebar]
        D --> G[MessagesView]
        D --> H[ThreadView]
        
        E --> J[SearchInput]
        E --> K[QuickSwitcher]
        E --> L[StatusSelector]
        
        F --> M[Channel List]
        F --> N[User List]
        
        G --> O[MessagesList]
        G --> P[MessageInput]
        
        O --> Q[MessageItem]
        Q --> R[EmojiPicker]
        Q --> S[FileAttachmentView]
        
        P --> T[RichTextEditor]
        P --> U[FileUpload]
    end
    
    subgraph "Custom Hooks"
        V[useAuth]
        W[useSupabaseData]
        Y[useSupabaseSettings]
        Z[useUserStatus]
        AA[useSlackData]
    end
    
    subgraph "UI Components (shadcn/ui)"
        BB[Dialog]
        CC[Button]
        DD[Input]
        EE[Avatar]
        FF[Card]
        GG[Tooltip]
    end
    
    A --> V
    D --> W
    I --> X
    A --> Y
    A --> Z
    A --> AA
    
    D --> BB
    D --> CC
    D --> DD
    D --> EE
    D --> FF
    D --> GG
    
    style A fill:#4fc3f7
    style V fill:#81c784
    style BB fill:#ffb74d
```

## Backend Architecture

```mermaid
graph TB
    subgraph "Supabase Services"
        A[API Gateway] --> B[Authentication]
        A --> C[Database API]
        A --> D[Storage API]
        A --> E[Real-time API]
        
        B --> F[JWT Tokens]
        B --> G[OAuth Providers]
        
        C --> H[PostgreSQL]
        H --> I[Row Level Security]
        H --> J[Database Functions]
        H --> K[Triggers]
        
        D --> L[File Storage]
        L --> M[Image Processing]
        L --> N[CDN Distribution]
        
        E --> O[WebSocket Server]
        O --> P[Change Data Capture]
        O --> Q[Presence System]
    end
    
    subgraph "Database Tables"
        R[users]
        S[channels]
        T[messages]
        U[reactions]
        V[user_settings]
        W[calls]
    end
    
    C --> R
    C --> S
    C --> T
    C --> U
    C --> V
    C --> W
    
    style A fill:#e1f5fe
    style H fill:#e8f5e8
    style B fill:#fff3e0
    style E fill:#f3e5f5
```

## Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        text email
        text username
        text avatar_url
        user_status status
        timestamp created_at
        timestamp updated_at
    }
    
    channels {
        uuid id PK
        text name
        text description
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    messages {
        uuid id PK
        text content
        uuid user_id FK
        uuid channel_id FK
        uuid thread_id FK
        jsonb attachments
        boolean edited
        timestamp edited_at
        timestamp created_at
        timestamp updated_at
    }
    
    reactions {
        uuid id PK
        uuid message_id FK
        uuid user_id FK
        text emoji
        timestamp created_at
    }
    
    user_settings {
        uuid id PK
        uuid user_id FK
        text theme
        boolean dark_mode
        jsonb notification_settings
        jsonb last_read_timestamps
        timestamp created_at
        timestamp updated_at
    }
    
    calls {
        uuid id PK
        call_type type
        uuid initiator_id FK
        text[] participants
        call_status status
        uuid channel_id FK
        timestamp start_time
        timestamp end_time
        text recording_url
        timestamp created_at
        timestamp updated_at
    }
    
    users ||--o{ channels : creates
    users ||--o{ messages : sends
    channels ||--o{ messages : contains
    messages ||--o{ messages : replies_to
    messages ||--o{ reactions : has
    users ||--o{ reactions : gives
    users ||--o{ user_settings : has
    users ||--o{ calls : initiates
    channels ||--o{ calls : hosts
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant S as Supabase Auth
    participant D as Database
    participant UI as UI Components
    
    U->>A: Open Application
    A->>S: Get Session
    S-->>A: Session Data
    
    alt No Session
        A->>UI: Show AuthComponent
        U->>UI: Enter Credentials
        UI->>S: Sign In/Up Request
        S-->>UI: Auth Response
        
        alt Success
            S->>A: Auth State Change
            A->>D: Fetch/Create User Profile
            D-->>A: User Data
            A->>UI: Show Main App
        else Error
            S-->>UI: Error Message
        end
    else Has Session
        A->>D: Fetch User Profile
        D-->>A: User Data
        A->>UI: Show Main App
    end
    
    Note over A,S: JWT tokens automatically handled
    Note over A,D: RLS policies enforce security
```

## Real-time Data Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant A1 as App 1
    participant S as Supabase
    participant A2 as App 2
    participant U2 as User 2
    
    U1->>A1: Send Message
    A1->>A1: Optimistic Update
    A1->>S: Insert Message
    S->>S: Database Insert
    S-->>A1: Confirmation
    S->>A2: Real-time Event
    A2->>A2: Update Messages
    A2->>U2: Show New Message
    
    Note over A1,A2: Real-time via WebSocket
    Note over A1: Optimistic updates for UX
    Note over S: Change Data Capture
```

## Component Architecture

```mermaid
graph TD
    subgraph "App Structure"
        A[App.tsx] --> B{User Authenticated?}
        B -->|No| C[AuthComponent]
        B -->|Yes| D[Main Layout]
        
        C --> E[Login Form]
        C --> F[Register Form]
        C --> G[OAuth Buttons]
        
        D --> H[Header]
        D --> I[Sidebar]
        D --> J[Main Content]
        D --> K[Modals/Dialogs]
        
        H --> L[Search]
        H --> M[User Menu]
        H --> N[Quick Switcher]
        
        I --> O[Channel List]
        I --> P[Direct Messages]
        I --> Q[Status Indicator]
        
        J --> R{Current View}
        R -->|Channel| S[MessagesView]
        R -->|Thread| T[ThreadView]
        R -->|Call| U[CallInterface]
        
        S --> V[MessagesList]
        S --> W[MessageInput]
        
        K --> X[Settings Modal]
        K --> Y[Call Dialog]
        K --> Z[Shortcuts Help]
    end
    
    style A fill:#4fc3f7
    style C fill:#ffb74d
    style D fill:#81c784
```

## State Management

```mermaid
graph TD
    subgraph "Global State (Context)"
        A[AuthContext] --> B[User Info]
        A --> C[Session Data]
        A --> D[Loading State]
    end
    
    subgraph "Data Hooks"
        E[useSupabaseData] --> F[Messages]
        E --> G[Channels]
        E --> H[Current Channel]
        E --> I[Last Read Timestamps]
        
        J[useSupabaseSettings] --> K[Theme]
        J --> L[Dark Mode]
        J --> M[Notifications]
        
        N[useSupabaseCalls] --> O[Call History]
        N --> P[Current Call]
        N --> Q[Recordings]
        
        R[useUserStatus] --> S[User Status]
        R --> T[Status Updates]
    end
    
    subgraph "Local State"
        U[Component State] --> V[Form Data]
        U --> W[UI State]
        U --> X[Temporary Data]
    end
    
    subgraph "Persistence"
        Y[Supabase] --> Z[Real-time Sync]
        AA[localStorage] --> BB[Offline Support]
    end
    
    A --> E
    A --> J
    A --> N
    A --> R
    
    E --> Y
    J --> Y
    N --> Y
    R --> Y
    
    E --> AA
    J --> AA
    
    style A fill:#e1f5fe
    style E fill:#e8f5e8
    style Y fill:#f3e5f5
```

## Technology Stack

```mermaid
mindmap
  root((SlackHub Messenger))
    Frontend
      React 19
        Functional Components
        Hooks
        Context API
      TypeScript
        Strict Mode
        Type Safety
        Interfaces
      Vite
        Fast Development
        Hot Reload
        Modern Bundling
      Tailwind CSS v4
        Utility Classes
        Custom Variables
        Responsive Design
      Radix UI
        Accessible Components
        Headless Primitives
        Keyboard Navigation
    Backend
      Supabase
        Database
          PostgreSQL
          Row Level Security
          Real-time Subscriptions
        Authentication
          JWT Tokens
          OAuth Providers
          Anonymous Users
        Storage
          File Uploads
          CDN Distribution
          Image Processing
        Edge Functions
          Serverless
          TypeScript Runtime
    Real-time
      WebSocket
        Live Data Sync
        Presence System
        Change Notifications
      WebRTC
        Peer-to-peer Calls
        Media Streaming
        Recording
    Tools
      ESLint
        Code Quality
        Best Practices
      Git
        Version Control
        Collaboration
      VS Code
        Development Environment
        Extensions
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        A[Local Development] --> B[Vite Dev Server]
        A --> C[Supabase Local]
    end
    
    subgraph "Build Process"
        D[Source Code] --> E[TypeScript Compilation]
        E --> F[Vite Build]
        F --> G[Static Assets]
        G --> H[Optimized Bundle]
    end
    
    subgraph "Production Environment"
        I[CDN/Hosting Platform] --> J[Static Files]
        K[Supabase Cloud] --> L[Database]
        K --> M[Authentication]
        K --> N[Storage]
        K --> O[Real-time]
    end
    
    subgraph "Monitoring & Analytics"
        P[Error Tracking]
        Q[Performance Monitoring]
        R[Usage Analytics]
    end
    
    H --> I
    A --> K
    I --> P
    I --> Q
    I --> R
    
    style A fill:#e1f5fe
    style I fill:#e8f5e8
    style K fill:#f3e5f5
    style P fill:#fff3e0
```

## Data Flow Patterns

### Optimistic Updates
```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as Data Hook
    participant Local as Local State
    participant API as Supabase API
    participant RT as Real-time
    
    UI->>Hook: User Action (e.g., send message)
    Hook->>Local: Optimistic Update
    Local-->>UI: Immediate UI Update
    Hook->>API: API Call
    
    alt Success
        API-->>Hook: Success Response
        API->>RT: Trigger Real-time Update
        RT-->>Hook: Confirmation
        Hook->>Local: Replace Optimistic with Real Data
    else Error
        API-->>Hook: Error Response
        Hook->>Local: Rollback Optimistic Update
        Hook-->>UI: Show Error Message
    end
```

### Real-time Synchronization
```mermaid
sequenceDiagram
    participant DB as Database
    participant CDC as Change Data Capture
    participant WS as WebSocket Server
    participant Client1 as Client 1
    participant Client2 as Client 2
    
    Client1->>DB: Insert/Update/Delete
    DB->>CDC: Trigger Change Event
    CDC->>WS: Process Change
    WS->>Client1: Confirmation
    WS->>Client2: Real-time Update
    Client2->>Client2: Update Local State
```

## Security Architecture

```mermaid
graph TD
    subgraph "Frontend Security"
        A[Input Validation] --> B[XSS Prevention]
        C[HTTPS Only] --> D[Secure Headers]
        E[Environment Variables] --> F[No Secrets in Code]
    end
    
    subgraph "Authentication Security"
        G[JWT Tokens] --> H[Short Expiration]
        I[Refresh Tokens] --> J[Secure Storage]
        K[OAuth Integration] --> L[PKCE Flow]
    end
    
    subgraph "Database Security"
        M[Row Level Security] --> N[User-based Access]
        O[Prepared Statements] --> P[SQL Injection Prevention]
        Q[Encrypted at Rest] --> R[SSL in Transit]
    end
    
    subgraph "API Security"
        S[Rate Limiting] --> T[DDoS Protection]
        U[CORS Configuration] --> V[Origin Validation]
        W[Request Validation] --> X[Schema Enforcement]
    end
    
    A --> G
    G --> M
    M --> S
    
    style A fill:#ffcdd2
    style G fill:#f8bbd9
    style M fill:#e1bee7
    style S fill:#c5cae9
```

## Performance Optimization

```mermaid
mindmap
  root((Performance))
    Frontend
      Code Splitting
        Dynamic Imports
        Route-based Splitting
        Component Lazy Loading
      Bundle Optimization
        Tree Shaking
        Minification
        Compression
      React Optimization
        Memo Components
        Callback Hooks
        Effect Dependencies
    Backend
      Database
        Indexing
        Query Optimization
        Connection Pooling
      Caching
        CDN
        Browser Cache
        API Cache
      Real-time
        Connection Management
        Event Filtering
        Batch Updates
    Infrastructure
      CDN Distribution
      Edge Locations
      Load Balancing
      Auto Scaling
```

---

This architecture document provides a comprehensive view of the SlackHub Messenger application, from high-level system design to detailed component interactions. The Mermaid diagrams illustrate the relationships between different parts of the system and help understand the data flow, security measures, and performance considerations.
