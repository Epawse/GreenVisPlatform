# Development Tooling Specification

## ADDED Requirements

### Requirement: Fast Development Server
The development server startup time SHALL be within acceptable limits (≤2 seconds) to ensure smooth development experience. The system MUST support fast hot module replacement (≤200ms).

#### Scenario: Cold start within 2 seconds
- **GIVEN** the project is in a non-running state
- **WHEN** developer runs `pnpm dev` command
- **THEN** development server should start within 2 seconds
- **AND** the application should be accessible in browser

#### Scenario: Hot module replacement under 200ms
- **GIVEN** development server is running
- **WHEN** developer modifies a source code file
- **THEN** browser should reflect changes within 200 milliseconds
- **AND** application state should not be lost

### Requirement: Code Format Consistency
The project MUST use automated tooling (Prettier) to ensure code format consistency. All source code files SHALL conform to unified formatting standards.

#### Scenario: Automatic formatting on save
- **GIVEN** developer edits a source code file
- **WHEN** file is saved
- **THEN** code format should automatically adjust to project standards
- **AND** formatting should not change code logic

#### Scenario: Pre-commit format check
- **GIVEN** developer commits code to git
- **WHEN** format check command is executed
- **THEN** all source files should conform to format specifications
- **AND** non-conforming files should be flagged

### Requirement: Unified Package Manager
The project MUST use a single package manager (pnpm) to avoid dependency conflicts. The project root directory SHALL contain only the corresponding package manager's lock file.

#### Scenario: Enforce pnpm usage
- **GIVEN** project is configured to use pnpm
- **WHEN** developer attempts to use npm install
- **THEN** error message should prompt to use pnpm
- **AND** package.json should declare packageManager field

#### Scenario: Lock file consistency
- **GIVEN** project uses pnpm as package manager
- **WHEN** checking project root directory
- **THEN** only pnpm-lock.yaml should exist
- **AND** package-lock.json or yarn.lock should not exist

### Requirement: Optimized Bundle Size
Production builds MUST optimize code splitting to reduce initial load size. Route pages SHALL implement lazy loading. Initial JS bundle size MUST be less than 1MB.

#### Scenario: Route-based code splitting
- **GIVEN** application has multiple route pages
- **WHEN** building production version
- **THEN** each route should generate independent chunk files
- **AND** initial page should only load necessary code

#### Scenario: Lazy loading reduces initial bundle
- **GIVEN** application has route lazy loading enabled
- **WHEN** user visits homepage
- **THEN** initial JS load size should be less than 1MB
- **AND** other page code should load only when accessed

### Requirement: Modular Component Architecture
Complex components MUST be split into smaller, single-responsibility sub-components. Component files SHALL not exceed 300 lines of code.

#### Scenario: Component size limit
- **GIVEN** a Vue component file
- **WHEN** component line count exceeds 300 lines
- **THEN** it should be considered for splitting into multiple sub-components
- **AND** each sub-component should have a clear responsibility

#### Scenario: Extract reusable UI components
- **GIVEN** a UI element is used in multiple places
- **WHEN** developing new features or refactoring
- **THEN** it should be extracted as an independent component
- **AND** component should be placed in `src/components/` directory

#### Scenario: Basemap selector as separate component
- **GIVEN** Map.vue contains basemap selection functionality
- **WHEN** extracting basemap selector as independent component
- **THEN** should create `BasemapSelector.vue` component
- **AND** Map.vue should communicate with it via props and events
- **AND** Map.vue code line count should decrease by at least 150 lines
