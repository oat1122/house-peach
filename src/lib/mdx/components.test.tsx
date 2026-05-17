/**
 * Tests for MDX component whitelist — specifically MdxLink's URL scheme guard.
 *
 * MdxLink is the `a` entry in baseMdxComponents. We render it directly via
 * Testing Library rather than going through next-mdx-remote/rsc (which needs
 * a real RSC runtime not available in jsdom).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Stubs for Next.js modules ─────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} data-next-link="true" {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: { src: string; alt: string } & Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...(rest as Record<string, unknown>)} />
  ),
}));

// Import after mocks are registered.
const { baseMdxComponents } = await import('./components');
const MdxLink = baseMdxComponents.a;

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderLink(href: string, text = 'Click me') {
  render(<MdxLink href={href}>{text}</MdxLink>);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('MdxLink — external https URLs', () => {
  it('renders https:// as an <a> with rel="noopener noreferrer"', () => {
    renderLink('https://example.com');
    const link = screen.getByRole('link');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('renders https:// with target="_blank"', () => {
    renderLink('https://example.com', 'External');
    const link = screen.getByRole('link');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});

describe('MdxLink — root-relative and fragment paths', () => {
  it('renders root-relative /about via next/link', () => {
    renderLink('/about', 'About');
    const link = screen.getByRole('link');
    expect(link.getAttribute('data-next-link')).toBe('true');
    expect(link.getAttribute('href')).toBe('/about');
  });

  it('renders bare fragment #section via next/link', () => {
    renderLink('#section', 'Section');
    const link = screen.getByRole('link');
    expect(link.getAttribute('data-next-link')).toBe('true');
    expect(link.getAttribute('href')).toBe('#section');
  });
});

describe('MdxLink — allowed safe schemes', () => {
  it('renders mailto: as a link', () => {
    renderLink('mailto:hi@example.com', 'Email');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('mailto:hi@example.com');
  });

  it('renders tel: as a link', () => {
    renderLink('tel:+66123456789', 'Call');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('tel:+66123456789');
  });
});

describe('MdxLink — rejected dangerous schemes', () => {
  it('renders javascript: href as <span> — no link', () => {
    renderLink('javascript:alert(1)', 'XSS');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('XSS').tagName).toBe('SPAN');
  });

  it('renders data: URL as <span> — no link', () => {
    renderLink('data:text/html,<h1>hi</h1>', 'Data');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Data').tagName).toBe('SPAN');
  });

  it('renders vbscript: href as <span> — no link', () => {
    renderLink('vbscript:msgbox(1)', 'VBS');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('VBS').tagName).toBe('SPAN');
  });
});

describe('MdxLink — missing href', () => {
  it('renders as <span> when href is undefined', () => {
    render(<MdxLink>No href</MdxLink>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('No href').tagName).toBe('SPAN');
  });
});
