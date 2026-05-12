const SYSTEM_PROMPT = `You are an expert coding assistant embedded inside a code editor.
You receive code context and respond with practical, minimal answers.
Always wrap code in markdown fences: \`\`\`language ... \`\`\` (use the actual language name).
For completions: return ONLY the code to insert at the cursor — no explanation, no fences.
For explanations: be concise, 3-5 sentences max. Include code examples in fences if helpful.
For refactoring: return the full rewritten block in a code fence, then one brief sentence on what changed.
For debugging: identify the issue in one sentence, then return the fixed code in a fence.
For free-form questions: answer directly and concisely using fences for any code.`;

const INLINE_SYSTEM_PROMPT = `You are an expert coding assistant making inline edits to source code.
You are given the full file for context and a specific <selected_block> to modify.
Return ONLY the rewritten <selected_block> — nothing else.
No explanation. No markdown fences. No backticks. No language labels. No surrounding code.
Preserve the original indentation exactly. Only change what the instruction asks for.`;

const FIX_SYSTEM_PROMPT = `You are an expert coding assistant fixing bugs in source code.
Use the full source context before deciding on a fix.
Return ONLY the requested replacement code — nothing else.
Rules:
- Only fix actual syntax errors, undefined variables, type mismatches, or runtime-breaking logic.
- Do NOT remove lines unless they are the direct cause of a runtime error.
- Do NOT reformat, rename, or improve style.
- If the target code has no bug, return it exactly as-is.
No explanation. No markdown fences. No backticks. Preserve indentation exactly.`;

const EXPLAIN_BRIEF_SYSTEM_PROMPT = `You are an expert coding assistant.
Explain the given code in 2-3 plain-English sentences. Be direct and clear.
No code examples. No markdown. No fences. Just plain prose.`;

export type AITask =
  | "completion"
  | "explanation"
  | "refactor"
  | "debug"
  | "free"
  | "inline_edit"
  | "fix"
  | "explain_brief";

interface LLMParams {
  language: string;
  code: string;
  cursorLine: number;
  cursorCol: number;
  task: AITask;
  error?: string;
  selectedText?: string;
  prefix?: string;
  userMessage?: string;
}

function buildUserPrompt(params: LLMParams): string {
  const { language, code, cursorLine, cursorCol, task, error, selectedText, prefix, userMessage } = params;

  if (task === "completion") {
    return `Language: ${language}
Task: completion — continue the code naturally from the cursor position.
Code up to cursor:
${prefix ?? code}`;
  }

  if (task === "inline_edit") {
    if (selectedText) {
      return `Language: ${language}
Instruction: ${userMessage || "Refactor this selected block for clarity, readability, and best practices."}

<full_file_context — read_only — DO NOT reproduce this in your response>
\`\`\`${language}
${code}
\`\`\`
</full_file_context>

<selected_block — THIS is what you must rewrite>
${selectedText}
</selected_block>

Return ONLY the rewritten version of <selected_block>. No explanation, no fences, no extra code. Match the surrounding indentation exactly.`;
    }
    return `Language: ${language}
Instruction: ${userMessage || "Improve this code"}
Full code to modify:
${code}`;
  }

  if (task === "fix") {
    if (selectedText) {
      const errorLine = error
        ? `Error from execution: ${error}`
        : `No execution error was provided. Only fix actual syntax errors, undefined variables, type mismatches, or broken logic that would cause a runtime failure.\nDo NOT remove lines or change style. If this code looks correct, return it unchanged.`;

      return `Language: ${language}
Task: Fix the bug in the selected block only.
${errorLine}

<full_file_context — read_only — DO NOT reproduce this in your response>
\`\`\`${language}
${code}
\`\`\`
</full_file_context>

Use the full file context to understand imports, variables, functions, types, control flow, and how the selected block fits into the program.
You may change ONLY the selected block in your response. Do not include unchanged surrounding code.

<selected_block — THIS is what you must fix>
${selectedText}
</selected_block>

Return ONLY the corrected version of <selected_block>. The replacement must align with the full file context. No explanation, no fences, no extra code. Match the surrounding indentation exactly.`;
    }
    return `Language: ${language}
Task: Fix the bug in the full file.
Error context: ${error ?? "Fix any issues found"}

Return the COMPLETE corrected file, not just the broken line or a snippet.
Use the error context and the whole source to make a fix that is consistent with surrounding imports, variables, functions, types, and call sites.
No explanation, no markdown fences, no extra text.

Full file:
\`\`\`${language}
${code}
\`\`\``;
  }

  if (task === "explain_brief") {
    return `Language: ${language}
Code to explain:
${selectedText ?? code}`;
  }

  if (task === "free" && userMessage) {
    return `Language: ${language}
Question: ${userMessage}
${selectedText ? `\nSelected code:\n\`\`\`${language}\n${selectedText}\n\`\`\`` : ""}
Full code:
\`\`\`${language}
${code}
\`\`\``;
  }

  return `Language: ${language}
Task: ${task}
Error (if any): ${error ?? "none"}
Cursor: line ${cursorLine}, col ${cursorCol}
${selectedText ? `\nFocus on this selected block:\n\`\`\`${language}\n${selectedText}\n\`\`\`\n` : ""}Full code:
\`\`\`${language}
${code}
\`\`\``;
}

function getSystemPrompt(task: AITask): string {
  if (task === "fix") return FIX_SYSTEM_PROMPT;
  if (task === "inline_edit") return INLINE_SYSTEM_PROMPT;
  if (task === "explain_brief") return EXPLAIN_BRIEF_SYSTEM_PROMPT;
  return SYSTEM_PROMPT;
}

function stripFences(text: string): string {
  return text.trim().replace(/^```[\w\s-]*\n?/, "").replace(/\n?```\s*$/, "").trim();
}

export async function callLLM(params: LLMParams): Promise<string> {
  const response = await fetch(process.env.AI_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(params) },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API responded with ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content ?? "") as string;
}

export async function callLLMClean(params: LLMParams): Promise<string> {
  const response = await fetch(process.env.AI_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
      messages: [
        { role: "system", content: getSystemPrompt(params.task) },
        { role: "user", content: buildUserPrompt(params) },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API responded with ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const raw = (data.choices?.[0]?.message?.content ?? "") as string;
  return stripFences(raw);
}

export async function* callLLMStream(params: LLMParams): AsyncGenerator<string> {
  const response = await fetch(process.env.AI_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(params) },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API responded with ${response.status}: ${errText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
}
