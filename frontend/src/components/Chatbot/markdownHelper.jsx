import React from "react";

/**
 * Lightweight, zero-dependency Markdown renderer for Chatbot responses
 * Formats: bold, italic, code, blockquotes, bullet lists, numbered lists, tables, headers, line breaks
 */
export function formatMarkdown(text) {
  if (!text) return null;

  // Split lines to handle blocks
  const lines = text.split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let inList = false;
  let listItems = [];
  let listType = "ul"; // 'ul' or 'ol'

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="chatbot-md-ul">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="chatbot-md-ol">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ol>
        );
      }
      inList = false;
      listItems = [];
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <pre key={`code-${elements.length}`} className="chatbot-md-code-block">
          <code>{codeBlockLines.join("\n")}</code>
        </pre>
      );
      inCodeBlock = false;
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code block toggle (```)
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty lines
    if (!line) {
      flushList();
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h3-${i}`} className="chatbot-md-h3">
          {parseInlineFormatting(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h2-${i}`} className="chatbot-md-h2">
          {parseInlineFormatting(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={`h1-${i}`} className="chatbot-md-h1">
          {parseInlineFormatting(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={`quote-${i}`} className="chatbot-md-blockquote">
          {parseInlineFormatting(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered list (- or * or •)
    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (inList && listType !== "ul") flushList();
      inList = true;
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list (1. 2. etc.)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList && listType !== "ol") flushList();
      inList = true;
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    // Regular line / paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="chatbot-md-p">
        {parseInlineFormatting(rawLine)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return <div className="chatbot-markdown-content">{elements}</div>;
}

/**
 * Handles inline formatting: **bold**, *italic*, `code`
 */
function parseInlineFormatting(str) {
  if (!str) return "";

  // Split tokens by bold (**...**), inline code (`...`), italic (*...*)
  const tokens = [];
  let remaining = str;
  let keyIdx = 0;

  // Pattern matching: **bold** or `code` or *italic*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;

  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(str.substring(lastIndex, match.index));
    }

    const chunk = match[0];
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="chatbot-md-bold">
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith("`") && chunk.endsWith("`")) {
      tokens.push(
        <code key={`c-${keyIdx++}`} className="chatbot-md-inline-code">
          {chunk.slice(1, -1)}
        </code>
      );
    } else if (chunk.startsWith("*") && chunk.endsWith("*")) {
      tokens.push(
        <em key={`i-${keyIdx++}`} className="chatbot-md-italic">
          {chunk.slice(1, -1)}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < str.length) {
    tokens.push(str.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : str;
}
