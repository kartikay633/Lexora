---
version: alpha
name: Lexora
description: A compact compiler workbench for editing and running Lex and Yacc specifications.
colors:
  background: "#0a0b0e"
  surface: "#101217"
  primaryText: "#f3f4f6"
  secondaryText: "#9ca3af"
  accent: "#22c55e"
typography:
  sans:
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif"
  mono:
    fontFamily: "Consolas, 'SFMono-Regular', 'Liberation Mono', monospace"
rounded:
  sm: "6px"
  md: "6px"
  lg: "8px"
  xl: "10px"
omitted:
  - section: spacing
    reason: Existing component CSS owns spacing; no global spacing scale is implemented.
  - section: components
    reason: Canonical components and behavior are documented below.
---

# Lexora design context

## Product and visual intent

Lexora is an English-language classroom compiler workbench. Preserve its editor-like density, restrained green accent, tonal panels, and monospace source labels. Project files, source editing, program input, and execution results are the main working surfaces. No market-specific design requirements have been established.

`frontend/src/index.css` is the canonical runtime source for colors, typography, radii, and both themes. This document mirrors that system; it does not generate tokens. Component styles consume its CSS variables. Use existing Lucide icons and visible text for important actions.

## Layout and interaction

The workspace uses a 270px file sidebar on desktop and stacks its panels at the existing mobile breakpoint. File names truncate within their row; full names remain available through accessible labels and titles. Keep controls within the sidebar width and preserve visible keyboard focus.

`FilePanel` owns project-file navigation and compilation-target controls. Opening a file changes only the editor. Compilation targets are independent choices: one `.l` lexer in Lex Only, one `.y` parser in Yacc Only, and both in Lex + Yacc. `App` owns the selected IDs, compile request, and browser persistence. Both selection methods use the same callbacks.

The private `TargetSelect` component is the shared owner for both target pickers. These are intentionally **native selects**: there is no search, multi-selection, or custom option content. Browser/OS ownership of popup geometry, keyboard navigation, and dismissal is accepted. The closed control uses the app's theme tokens. Do not introduce a custom popup merely to restyle the native menu.

The Compile targets section stays visible even with one eligible file. Empty pickers are disabled and explain which extension to add. Each eligible row also has a named Use action; selected rows show TARGET and a disabled Set action. The highlighted editor row and selected compilation targets represent different states.

## Feedback and accessibility

Target changes clear the previous execution result. While compilation runs, the workspace is inert and Compile displays its running state. Source errors remain in the existing diagnostics panel. Selection survives refresh through the existing workspace store.

Use native buttons for opening files and changing targets, with independent rename/delete actions. Associate labels with selectors, explain target behavior in visible helper text, and retain focus outlines in both themes. Green communicates selection alongside text and check icons; color alone must not identify a target.
