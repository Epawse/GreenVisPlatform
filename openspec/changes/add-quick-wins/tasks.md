# Implementation Tasks: Quick Wins - Tooling Modernization

## 1. Migrate to Vite (4 hours)

### 1.1 Install Vite Dependencies
- [ ] 1.1.1 Install Vite core packages
  ```bash
  pnpm add -D vite @vitejs/plugin-vue
  ```
- [ ] 1.1.2 Install Vite plugins
  ```bash
  pnpm add -D vite-plugin-node-polyfills
  ```
- [ ] 1.1.3 Remove Vue CLI dependencies
  ```bash
  pnpm remove @vue/cli-service @vue/cli-plugin-babel @vue/cli-plugin-eslint
  pnpm remove node-polyfill-webpack-plugin
  ```

### 1.2 Create Vite Configuration
- [ ] 1.2.1 Create `vite.config.js`
  - Configure Vue plugin
  - Configure path alias (`@` -> `src`)
  - Configure proxy (`/geoserver`)
  - Configure Node polyfills
- [ ] 1.2.2 Delete `vue.config.js`
- [ ] 1.2.3 Delete `babel.config.js` (Vite uses esbuild)

### 1.3 Adjust Project Structure
- [ ] 1.3.1 Move `public/index.html` to project root
- [ ] 1.3.2 Add `<script type="module" src="/src/main.js">` to `index.html`
- [ ] 1.3.3 Remove Vue CLI placeholders from `index.html` (`<%= ... %>`)

### 1.4 Update package.json Scripts
- [ ] 1.4.1 Update `scripts`:
  ```json
  {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .vue,.js"
  }
  ```

### 1.5 Test and Validate
- [ ] 1.5.1 Run `pnpm dev` to verify dev server starts
- [ ] 1.5.2 Test hot module replacement
- [ ] 1.5.3 Run `pnpm build` to verify production build
- [ ] 1.5.4 Test all major features (map loading, data switching, toolbar, etc.)

---

## 2. Add Prettier (1 hour)

### 2.1 Install Prettier
- [ ] 2.1.1 Install Prettier core package
  ```bash
  pnpm add -D prettier
  ```
- [ ] 2.1.2 Install ESLint integration
  ```bash
  pnpm add -D eslint-config-prettier eslint-plugin-prettier
  ```

### 2.2 Create Configuration Files
- [ ] 2.2.1 Create `.prettierrc`
  ```json
  {
    "semi": true,
    "singleQuote": false,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "arrowParens": "always"
  }
  ```
- [ ] 2.2.2 Create `.prettierignore`
  ```
  node_modules
  dist
  public
  *.md
  pnpm-lock.yaml
  ```

### 2.3 Update ESLint Configuration
- [ ] 2.3.1 Add to `package.json` `eslintConfig.extends`:
  ```json
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "plugin:prettier/recommended"
  ]
  ```

### 2.4 Add Format Scripts
- [ ] 2.4.1 Add to `package.json`:
  ```json
  "format": "prettier --write \"src/**/*.{js,vue}\"",
  "format:check": "prettier --check \"src/**/*.{js,vue}\""
  ```

### 2.5 Format Existing Code
- [ ] 2.5.1 Run `pnpm format` to format all code
- [ ] 2.5.2 Check formatting results, ensure no functionality broken
- [ ] 2.5.3 Commit formatted code

---

## 3. Unified Package Manager (0.5 hours)

### 3.1 Clean npm Files
- [ ] 3.1.1 Delete `package-lock.json`
  ```bash
  rm package-lock.json
  ```
- [ ] 3.1.2 Confirm `pnpm-lock.yaml` exists and is up-to-date

### 3.2 Configure pnpm
- [ ] 3.2.1 Create `.npmrc`
  ```
  # Force use of pnpm
  engine-strict=true
  ```
- [ ] 3.2.2 Add to `package.json`:
  ```json
  "engines": {
    "node": ">=16.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
  ```

### 3.3 Update README
- [ ] 3.3.1 Specify pnpm usage in README.md
- [ ] 3.3.2 Update install command to `pnpm install`

### 3.4 Reinstall Dependencies
- [ ] 3.4.1 Delete `node_modules`
  ```bash
  rm -rf node_modules
  ```
- [ ] 3.4.2 Reinstall with pnpm
  ```bash
  pnpm install
  ```
- [ ] 3.4.3 Verify project runs normally

---

## 4. Route Lazy Loading (1 hour)

### 4.1 Modify Route Configuration
- [ ] 4.1.1 Open `src/router/index.js`
- [ ] 4.1.2 Change synchronous imports to dynamic imports:
  ```javascript
  // Before:
  import Map from "../views/Map.vue";
  import testWMTS from "../views/testWMTS.vue";
  import testWFS from "../views/testWFS.vue";

  // After:
  const Map = () => import("../views/Map.vue");
  const testWMTS = () => import("../views/testWMTS.vue");
  const testWFS = () => import("../views/testWFS.vue");
  ```

### 4.2 Test and Validate
- [ ] 4.2.1 Run dev server, check route switching works
- [ ] 4.2.2 Open browser DevTools Network panel
- [ ] 4.2.3 Verify chunks load only when switching pages
- [ ] 4.2.4 Build production, check multiple chunk files generated

### 4.3 Performance Comparison
- [ ] 4.3.1 Test initial load performance with Lighthouse
- [ ] 4.3.2 Record initial JS bundle size before/after
- [ ] 4.3.3 Verify First Contentful Paint time reduced

---

## 5. Extract Basemap Selector Component (2 hours)

### 5.1 Create Component Directory Structure
- [ ] 5.1.1 Create `src/components/basemap/` directory
  ```bash
  mkdir -p src/components/basemap
  ```

### 5.2 Extract Component
- [ ] 5.2.1 Create `src/components/basemap/BasemapSelector.vue`
- [ ] 5.2.2 Copy basemap-related code from Map.vue:
  - `basemapVisible` state
  - `basemaps` configuration array
  - `switchBasemap()` method
  - Basemap selector template and styles
- [ ] 5.2.3 Define component Props:
  ```javascript
  props: {
    visible: Boolean
  }
  ```
- [ ] 5.2.4 Define component Emits:
  ```javascript
  emits: ['update:visible', 'basemap-change']
  ```

### 5.3 Modify Map.vue
- [ ] 5.3.1 Import BasemapSelector component
  ```javascript
  import BasemapSelector from '@/components/basemap/BasemapSelector.vue';
  ```
- [ ] 5.3.2 Register component in `components`
- [ ] 5.3.3 Replace basemap selector template with:
  ```vue
  <BasemapSelector
    v-model:visible="basemapVisible"
    @basemap-change="handleBasemapChange"
  />
  ```
- [ ] 5.3.4 Delete basemap-related methods and state
- [ ] 5.3.5 Delete basemap-related styles (~100 lines)

### 5.4 Implement Component Communication
- [ ] 5.4.1 Emit `basemap-change` event in BasemapSelector
- [ ] 5.4.2 Receive event in Map.vue and update map
- [ ] 5.4.3 Test basemap switching functionality works

### 5.5 Code Optimization
- [ ] 5.5.1 Rewrite BasemapSelector with Composition API (optional)
- [ ] 5.5.2 Extract basemaps config to separate file (optional)
- [ ] 5.5.3 Add component comments and documentation

### 5.6 Test and Validate
- [ ] 5.6.1 Test all basemap switching functionality
- [ ] 5.6.2 Verify basemap panel show/hide
- [ ] 5.6.3 Check console for errors
- [ ] 5.6.4 Verify styles are correct

---

## 6. Final Validation and Deployment

### 6.1 Comprehensive Testing
- [ ] 6.1.1 Test all major features:
  - Map loading and interaction
  - Data switching (year, type, policy)
  - Chart display
  - Toolbar (measure, draw)
  - Basemap switching
  - Suggestions display
- [ ] 6.1.2 Test in different browsers (Chrome, Firefox, Edge)
- [ ] 6.1.3 Test production build

### 6.2 Performance Validation
- [ ] 6.2.1 Run Lighthouse performance test
- [ ] 6.2.2 Compare metrics before/after
- [ ] 6.2.3 Record performance improvement data

### 6.3 Code Review
- [ ] 6.3.1 Review all modified files
- [ ] 6.3.2 Ensure code format is consistent (run `pnpm format:check`)
- [ ] 6.3.3 Ensure ESLint has no errors (run `pnpm lint`)

### 6.4 Documentation Update
- [ ] 6.4.1 Update development commands in README.md
- [ ] 6.4.2 Record performance improvement data
- [ ] 6.4.3 Add Prettier usage instructions

### 6.5 Git Commit
- [ ] 6.5.1 Create feature branch `git checkout -b feat/quick-wins`
- [ ] 6.5.2 Commit each improvement separately (5 commits)
- [ ] 6.5.3 Push to remote repository

### 6.6 Deploy and Test
- [ ] 6.6.1 Deploy to test environment
- [ ] 6.6.2 Verify production version functions normally
- [ ] 6.6.3 Get team feedback

---

## Rollback Plan

If issues require rollback:

### Vite Migration Rollback
```bash
git checkout main -- vue.config.js babel.config.js package.json
pnpm install
```

### Prettier Rollback
```bash
rm .prettierrc .prettierignore
git checkout main -- package.json
```

### Route Lazy Loading Rollback
```bash
git checkout main -- src/router/index.js
```

### Component Extraction Rollback
```bash
git checkout main -- src/views/Map.vue
rm -rf src/components/basemap
```

---

## Notes

- ✅ Test immediately after completing each major item (1-5)
- ✅ Record issues promptly, don't proceed to next item
- ✅ Maintain functionality, only improve tooling and code organization
- ✅ Run comprehensive tests before committing
- ✅ Each commit should be independently functional (atomic)
