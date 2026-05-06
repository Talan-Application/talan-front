# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check + production build (output: dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Stack

- **React 19** with **TypeScript 6**
- **Vite 8** as bundler and dev server
- **ESLint** with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`

## Project Structure

```
src/          # Application source
  main.tsx    # Entry point — mounts <App /> into #root
  App.tsx     # Root component
public/       # Static assets served as-is
index.html    # Vite HTML entry point
```

## TypeScript Config

Two tsconfig files in use: `tsconfig.app.json` targets browser code under `src/`, `tsconfig.node.json` targets Vite config files. `tsconfig.json` references both. Always import from `src/` paths when writing application code.
