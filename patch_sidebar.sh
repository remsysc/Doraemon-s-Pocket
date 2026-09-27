#!/bin/bash

# We will use awk or sed to replace the sidebar light mode block.
# Actually, it's easier to just write a Node script to replace it.

node -e "
const fs = require('fs');
let css = fs.readFileSync('resources/css/dashboard.css', 'utf8');

const replacement = \`/* Sidebar now switches to light mode */
.layout[data-theme=\\"light\\"] .sidebar {
    background: #F8FAFC;
    border-right-color: #E2E8F0;
}

.sidebar--collapsed {
    width: 0;
    border-right: none;
}

.sidebar__header {
    padding: 20px 18px 16px;
    border-bottom: 1px solid var(--wb-border);
}

.layout[data-theme=\\"light\\"] .sidebar__header {
    border-bottom-color: #E2E8F0;
}

.sidebar__logo {
    font-size: 15px;
    font-weight: 700;
    background: linear-gradient(135deg, #3B82F6, #22D3EE);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.2px;
}

.layout[data-theme=\\"light\\"] .sidebar__logo {
    background: linear-gradient(135deg, #3B82F6, #22D3EE);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.sidebar__brand--light {
    font-weight: 400;
    -webkit-text-fill-color: inherit;
    color: inherit;
}

.layout[data-theme=\\"light\\"] .sidebar__brand--light {
    -webkit-text-fill-color: inherit;
    color: inherit;
}

.sidebar__brand--bold {
    font-weight: 700;
    -webkit-text-fill-color: inherit;
    color: inherit;
}

.layout[data-theme=\\"light\\"] .sidebar__brand--bold {
    -webkit-text-fill-color: inherit;
    color: inherit;
}

.sidebar__title {
    font-size: 11px;
    font-weight: 500;
    color: var(--wb-text-muted);
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.layout[data-theme=\\"light\\"] .sidebar__title {
    color: #64748B;
}

.sidebar__nav {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow-y: auto;
}

.sidebar__section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--wb-text-muted);
    padding: 20px 10px 6px;
}

.layout[data-theme=\\"light\\"] .sidebar__section-label {
    color: #94A3B8;
}

.sidebar__link {
    display: block;
    padding: 9px 12px;
    border-radius: var(--wb-radius-sm);
    text-decoration: none;
    color: var(--wb-text-secondary, #94A3B8);
    font-size: 13px;
    font-weight: 400;
    transition: background 0.12s ease, color 0.12s ease;
}

.layout[data-theme=\\"light\\"] .sidebar__link {
    color: #475569;
}

.sidebar__link:hover {
    background: rgba(59, 130, 246, 0.08);
    color: var(--wb-text-primary, #F8FAFC);
}

.layout[data-theme=\\"light\\"] .sidebar__link:hover {
    color: #0F172A;
    background: #F1F5F9;
}

.sidebar__link--active {
    background: rgba(59, 130, 246, 0.15);
    color: var(--wb-electric-blue);
    font-weight: 500;
    border-left: 3px solid var(--wb-electric-blue);
}

.layout[data-theme=\\"light\\"] .sidebar__link--active {
    color: #1D4ED8;
    background: #EFF6FF;
    border-left-color: #2563EB;
}

.sidebar__link-label {
    white-space: nowrap;
    overflow: hidden;
}

.sidebar__footer {
    padding: 14px 18px;
    border-top: 1px solid var(--wb-border);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.layout[data-theme=\\"light\\"] .sidebar__footer {
    border-top-color: #E2E8F0;
}

.sidebar__user {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar__user-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--wb-text-primary, #F8FAFC);
}

.layout[data-theme=\\"light\\"] .sidebar__user-name {
    color: #0F172A;
}

.sidebar__user-role {
    font-size: 11px;
    color: var(--wb-text-muted);
    text-transform: capitalize;
}

.layout[data-theme=\\"light\\"] .sidebar__user-role {
    color: #64748B;
}

.sidebar__logout {
    background: none;
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #FCA5A5;
    padding: 7px 12px;
    border-radius: var(--wb-radius-sm);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    font-family: inherit;
    transition: background 0.12s ease, border-color 0.12s ease;
}

.layout[data-theme=\\"light\\"] .sidebar__logout {
    color: #DC2626;
    border-color: #FECACA;
}

.sidebar__logout:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.4);
}

.layout[data-theme=\\"light\\"] .sidebar__logout:hover {
    background: #FEF2F2;
    border-color: #FCA5A5;
}\`;

const regex = /\\/\\* Sidebar always stays dark \\*\\/[\\s\\S]*?\\.sidebar__logout:hover \\{[\\s\\S]*?\\}/;
css = css.replace(regex, replacement);
fs.writeFileSync('resources/css/dashboard.css', css);
"
npm run build
