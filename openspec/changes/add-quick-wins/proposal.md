# Change: Quick Wins - Development Tooling Modernization

## Why

The current project uses Vue CLI + Webpack, resulting in poor development experience:
- Development startup takes ~30 seconds
- Hot module replacement takes ~3 seconds
- Inconsistent code formatting (no Prettier)
- Mixed package managers (npm + pnpm)
- All routes load synchronously, large initial bundle size
- Map.vue file is too large (2,239 lines), needs component splitting

These issues severely impact development efficiency and code quality. Through the "Quick Wins" project, we can achieve significant development experience improvements with minimal time investment (**only 8.5 hours**).

## What Changes

This change includes 5 quick improvement items, prioritized:

### 1. Migrate to Vite ⚡ (4 hours)
- **Remove**: Vue CLI configuration (`vue.config.js`)
- **Add**: Vite configuration (`vite.config.js`)
- **Update**: `package.json` scripts and dependencies
- **Benefit**: Development startup speed improved **30x** (30s → 1s)

### 2. Add Prettier 🎨 (1 hour)
- **Add**: `.prettierrc` configuration file
- **Add**: `.prettierignore` ignore file
- **Update**: `package.json` add format scripts
- **Benefit**: Unified code style, reduced code review time

### 3. Unified Package Manager 📦 (0.5 hours)
- **Choose**: pnpm (faster, more space-efficient)
- **Delete**: `package-lock.json` (npm lock file)
- **Keep**: `pnpm-lock.yaml`
- **Add**: `.npmrc` to declare package manager
- **Benefit**: Avoid dependency conflicts, consistent build results

### 4. Route Lazy Loading 🚀 (1 hour)
- **Modify**: `src/router/index.js`
- **Change**: From synchronous import to dynamic import
- **Benefit**: Initial load time reduced ~40%

### 5. Extract Basemap Selector Component 🧩 (2 hours)
- **Add**: `src/components/basemap/BasemapSelector.vue`
- **Modify**: `src/views/Map.vue` (reduce ~200 lines)
- **Benefit**: Learn component splitting pattern, lay foundation for future refactoring

## Impact

### Affected Files
- **Delete**: `vue.config.js`, `babel.config.js`, `package-lock.json`
- **Add**: `vite.config.js`, `.prettierrc`, `.prettierignore`, `src/components/basemap/BasemapSelector.vue`
- **Modify**: `package.json`, `src/router/index.js`, `src/views/Map.vue`, `index.html`, `src/main.js`

### Affected Features
- ✅ **No breaking changes** - All existing features remain unchanged
- ✅ Significant development experience improvement
- ✅ Improved code quality
- ✅ Foundation laid for subsequent large-scale refactoring

### Beneficiaries
- 👨‍💻 **Developers**: Development speed improved 30x, automatic code formatting
- 👥 **Team**: Unified dependency management, smoother collaboration
- 📚 **Future Maintainers**: More readable code, modular components

### Risk Assessment
- **Low Risk**: Vite migration has mature solutions, easy rollback
- **No Risk**: Prettier, pnpm, lazy loading are non-invasive improvements
- **Controlled Risk**: Component extraction involves only one component, limited scope

## Success Metrics

Quantified metrics after improvement:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dev startup time | ~30s | ~1s | **30x** |
| HMR speed | ~3s | ~0.1s | **30x** |
| Code format consistency | Manual | Auto | **100%** |
| Dependency conflicts | Occasional | None | ✅ |
| Map.vue line count | 2,239 | ~2,039 | **-9%** |
| Initial JS bundle | ~1.2MB | ~0.8MB | **-33%** |

## Next Steps

1. ✅ Review this proposal
2. ⏳ Start implementation after approval (follow tasks.md order)
3. ⏳ Run tests after each completion
4. ⏳ Deploy to test environment after all tasks complete
5. ⏳ Merge to main branch after validation

## Timeline

- **Total effort**: 8.5 hours
- **Recommended**: 1-2 days (batch completion)
- **Fastest**: 1 day (focused implementation)

## Notes

- This change is the first step of the "Three-Phase Modernization Plan"
- Development experience improvement will be immediately noticeable after completion
- Paves the way for subsequent large-scale component splitting and TypeScript migration
- All improvements follow industry best practices
