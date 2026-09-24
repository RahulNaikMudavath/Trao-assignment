export function mockExtractRequirements(jd, companyUrl) {
  const rawLines = jd.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = rawLines[0] || 'Software Engineer';
  const title = firstLine.length < 80 ? firstLine.replace(/^#+\s*/, '') : 'Software Engineer';

  let seniority = 'Mid-level';
  if (/senior|lead|principal|staff|architect/i.test(jd)) seniority = 'Senior';
  else if (/junior|entry|associate|graduate|intern/i.test(jd)) seniority = 'Junior';

  const requirements = [];
  let reqCount = 1;

  // Extract explicit bullet points if present (lines starting with -, *, •, or numbered)
  const bulletLines = rawLines.filter((l) => /^[-*•\d.)\]]\s*/.test(l) && l.length > 5);

  if (bulletLines.length >= 2) {
    for (const line of bulletLines) {
      const cleanText = line
        .replace(/^[-*•\d.)\]]+\s*/, '')
        .replace(/\s*\((?:must|nice|required|bonus|preferred)[^)]*\)/i, '')
        .trim();

      if (cleanText.length < 4) continue;

      const isNice = /nice to have|bonus|preferred|plus|optional/i.test(line);
      const isBehavioural =
        !/state management|memory management|cache management|database management/i.test(cleanText) &&
        /\b(mentor|mentoring|leadership|lead|communication|collaborate|collaboration|team player|agile|scrum|stakeholder|ownership|cross-functional)\b/i.test(cleanText);
      const isDomain = /fintech|healthcare|ecommerce|ai|machine learning|security|compliance|cloud|devops|aws|gcp/i.test(cleanText);

      requirements.push({
        id: `r${reqCount++}`,
        text: cleanText,
        kind: isBehavioural ? 'behavioural' : isDomain ? 'domain' : 'technical',
        priority: isNice ? 'nice' : 'must',
      });
    }
  }

  // Fallback to pattern matching if fewer than 2 bullets were extracted
  if (requirements.length < 2) {
    const technicalPatterns = [
      { name: 'TypeScript / JavaScript', regex: /typescript|javascript|es6|node/i, priority: 'must' },
      { name: 'React / Frontend Frameworks', regex: /react|next\.?js|vue|angular/i, priority: 'must' },
      { name: 'Backend & APIs', regex: /express|rest|graphql|backend|api design/i, priority: 'must' },
      { name: 'Databases & Storage', regex: /mongodb|postgres|sql|nosql|database/i, priority: 'must' },
      { name: 'System Design & Architecture', regex: /system design|microservices|distributed|architecture/i, priority: 'must' },
      { name: 'Cloud & Infrastructure', regex: /aws|gcp|docker|kubernetes|cloud/i, priority: 'nice' },
      { name: 'Testing & CI/CD', regex: /testing|jest|vitest|ci\/cd|pipeline/i, priority: 'nice' },
    ];

    for (const item of technicalPatterns) {
      if (item.regex.test(jd) && !requirements.some((r) => r.text === item.name)) {
        const isBonus = /bonus|preferred|nice to have|plus/i.test(jd) && item.priority === 'nice';
        requirements.push({
          id: `r${reqCount++}`,
          text: item.name,
          kind: 'technical',
          priority: isBonus ? 'nice' : 'must',
        });
      }
    }

    if (/mentor|leadership|collaborat|communication|team/i.test(jd) && !requirements.some((r) => r.kind === 'behavioural')) {
      requirements.push({
        id: `r${reqCount++}`,
        text: 'Cross-functional collaboration and technical mentorship',
        kind: 'behavioural',
        priority: 'must',
      });
    }

    if (/agile|scrum|fast-paced|ambiguity|ownership/i.test(jd) && !requirements.some((r) => r.text.includes('Ownership'))) {
      requirements.push({
        id: `r${reqCount++}`,
        text: 'Ownership and navigating technical ambiguity',
        kind: 'behavioural',
        priority: 'must',
      });
    }
  }

  if (requirements.length === 0) {
    requirements.push({
      id: 'r1',
      text: rawLines[0] || 'Core Software Engineering Principles',
      kind: 'technical',
      priority: 'must',
    });
  }

  return {
    title,
    seniority,
    responsibilities: rawLines.slice(1, 5).length > 0 ? rawLines.slice(1, 5) : ['Design and build reliable software solutions'],
    requirements,
  };
}

export function mockGenerateCompanyBrief(companyUrl, pages) {
  let hostname = 'Target Company';
  try {
    hostname = new URL(companyUrl).hostname.replace('www.', '');
  } catch {}

  const hasPages = pages.length > 0;
  return {
    summary: hasPages
      ? `${hostname} is a technology company building modern software solutions.`
      : `Company details for ${companyUrl} could not be retrieved from public web pages.`,
    what_they_do: hasPages
      ? 'Operates digital platforms, developer tools, or cloud infrastructure.'
      : `No verified public company description found at ${companyUrl}.`,
    sources: pages.map((p) => p.url).filter(Boolean),
  };
}

export function mockGenerateQuestionsForRequirements(requirements, category, startId = 1) {
  const questions = [];
  let currentId = startId;

  const techPrompts = [
    (text) => ({
      prompt: `In the context of ${text}, explain how you structure production code to balance performance, maintainability, and error boundaries. What are the key architectural trade-offs?`,
      outline: `- Deep dive into runtime execution mechanics and lifecycle handling.\n- Best practices for defensive programming, memory management, and avoiding race conditions.\n- Concrete metrics and monitoring strategies used in production.`,
      diff: 2,
    }),
    (text) => ({
      prompt: `Describe an incident where a system utilizing ${text} experienced performance degradation or unexpected failure under peak load. How would you diagnose the root cause and refactor it?`,
      outline: `- Systematic triage approach: profiling CPU/memory, inspecting logs, and tracing asynchronous operations.\n- Immediate mitigation strategies (circuit breaking, connection limits, fallbacks).\n- Long-term architectural resolution and post-mortem best practices.`,
      diff: 3,
    }),
    (text) => ({
      prompt: `What are the common antipatterns or edge-case failure modes when implementing ${text}? How do you enforce consistency, validation, and type safety across boundaries?`,
      outline: `- Identification of subtle pitfalls (unhandled rejections, race conditions, memory leaks, unindexed queries).\n- Architectural patterns for decoupling and validation.\n- Automated testing strategies (unit, contract, and chaos engineering).`,
      diff: 2,
    }),
  ];

  let promptIdx = 0;

  for (const req of requirements) {
    if (category === 'technical' && req.kind === 'technical') {
      const template = techPrompts[promptIdx % techPrompts.length](req.text);
      promptIdx++;
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'technical',
        prompt: template.prompt,
        answer_outline: template.outline,
        difficulty: template.diff,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'behavioural' && req.kind === 'behavioural') {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'behavioural',
        prompt: `Tell me about a challenging situation involving ${req.text}. How did you navigate conflicting priorities and what measurable impact did you deliver?`,
        answer_outline: `- Situation & Task: Clear context regarding the team dynamics and technical obstacle.\n- Action: Specific collaborative steps taken with technical clarity and empathy.\n- Result: Quantifiable outcome (e.g. reduced cycle time, unblocked delivery, team growth).`,
        difficulty: 1,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'system-design' && (req.kind === 'technical' || req.kind === 'domain')) {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'system-design',
        prompt: `How would you architect a distributed, high-throughput service centered around ${req.text}? Walk me through your choices for data partitioning, caching tiers, and consistency guarantees.`,
        answer_outline: `- High-level architectural topology and API gateway layer.\n- Data storage selection, partitioning keys, and indexing strategy.\n- Caching strategy (TTL, write-through vs cache-aside) and cache invalidation.\n- Graceful degradation and fault tolerance during network partitions.`,
        difficulty: 3,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'company-fit') {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'company-fit',
        prompt: `How does your practical background in ${req.text} equip you to make an immediate impact on our engineering initiatives and velocity?`,
        answer_outline: `- Concrete alignment between your engineering standards and the company's technical stack.\n- Demonstration of rapid onboarding, cross-functional ownership, and domain curiosity.\n- Commitment to continuous learning and elevating team-wide practices.`,
        difficulty: 1,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    }
  }

  // Ensure at least 1 question is generated if the category is technical or system-design but req.kind didn't match
  if (questions.length === 0 && requirements.length > 0) {
    const firstReq = requirements[0];
    questions.push({
      id: `q${currentId++}`,
      requirement_ids: [firstReq.id],
      category: category,
      prompt: category === 'technical'
        ? `Explain key architectural considerations, trade-offs, and failure modes when working with ${firstReq.text}.`
        : `How does your experience with ${firstReq.text} prepare you to tackle challenges in our engineering environment?`,
      answer_outline: `Discuss core principles of ${firstReq.text}, memory/runtime implications, error handling, and production debugging techniques.`,
      difficulty: category === 'system-design' ? 3 : 2,
      metadata: { origin: 'generated', status: 'unmodified' },
    });
  }

  return questions;
}

export function mockGenerateFlashcards(requirements) {
  return requirements.map((req, idx) => ({
    id: `f${idx + 1}`,
    front: `Key architectural principles and failure modes of: ${req.text}`,
    back: `1. Core mechanics, lifecycle, and runtime behavior.\n2. Common production pitfalls, anti-patterns, and race conditions to avoid.\n3. Telemetry, monitoring, and debugging strategies in distributed production environments.`,
    requirement_ids: [req.id],
    metadata: { origin: 'generated', status: 'unmodified', confidence: 0 },
  }));
}
