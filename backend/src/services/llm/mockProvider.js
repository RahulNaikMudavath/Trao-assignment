export function mockExtractRequirements(jd, companyUrl) {
  const lines = jd.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Software Engineer';
  const title = firstLine.length < 80 ? firstLine : 'Software Engineer';

  let seniority = 'Mid-level';
  if (/senior|lead|principal|staff|architect/i.test(jd)) seniority = 'Senior';
  else if (/junior|entry|associate|graduate|intern/i.test(jd)) seniority = 'Junior';

  const requirements = [];
  let reqCount = 1;

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
    if (item.regex.test(jd)) {
      const isBonus = /bonus|preferred|nice to have|plus/i.test(jd) && item.priority === 'nice';
      requirements.push({
        id: `r${reqCount++}`,
        text: item.name,
        kind: 'technical',
        priority: isBonus ? 'nice' : 'must',
      });
    }
  }

  if (/mentor|leadership|collaborat|communication|team/i.test(jd)) {
    requirements.push({
      id: `r${reqCount++}`,
      text: 'Cross-functional collaboration and technical mentorship',
      kind: 'behavioural',
      priority: 'must',
    });
  }

  if (/agile|scrum|fast-paced|ambiguity|ownership/i.test(jd)) {
    requirements.push({
      id: `r${reqCount++}`,
      text: 'Ownership and navigating technical ambiguity',
      kind: 'behavioural',
      priority: 'must',
    });
  }

  if (/fintech|health|ecommerce|ai|security|compliance/i.test(jd)) {
    const domainMatch = jd.match(/fintech|healthcare|ecommerce|ai|machine learning|security|compliance/i);
    requirements.push({
      id: `r${reqCount++}`,
      text: `Domain expertise in ${domainMatch ? domainMatch[0] : 'core product area'}`,
      kind: 'domain',
      priority: 'nice',
    });
  }

  if (requirements.length === 0) {
    requirements.push({
      id: 'r1',
      text: lines[0] || 'General Software Engineering',
      kind: 'technical',
      priority: 'must',
    });
  }

  return {
    title,
    seniority,
    responsibilities: lines.slice(1, 5).length > 0 ? lines.slice(1, 5) : ['Design and build reliable software solutions'],
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

  for (const req of requirements) {
    if (category === 'technical' && req.kind === 'technical') {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'technical',
        prompt: `Explain key architectural considerations, trade-offs, and failure modes when working with ${req.text}.`,
        answer_outline: `Discuss core principles of ${req.text}, memory/runtime implications, error handling, and production debugging techniques.`,
        difficulty: 2,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'behavioural' && req.kind === 'behavioural') {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'behavioural',
        prompt: `Tell me about a challenging situation involving ${req.text}. What was the context and outcome?`,
        answer_outline: 'Use STAR format: Situation, Task, Action taken with technical and human empathy, and measurable Result.',
        difficulty: 1,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'system-design' && (req.kind === 'technical' || req.kind === 'domain')) {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'system-design',
        prompt: `How would you architect a resilient, scalable backend service addressing ${req.text}?`,
        answer_outline: 'Define API contracts, data model, partitioning/sharding, caching tier, and graceful degradation during traffic spikes.',
        difficulty: 3,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    } else if (category === 'company-fit') {
      questions.push({
        id: `q${currentId++}`,
        requirement_ids: [req.id],
        category: 'company-fit',
        prompt: `How does your experience with ${req.text} align with our company's mission and technical direction?`,
        answer_outline: 'Highlight mutual value: connect your personal philosophy on engineering rigor with the company\'s public goals.',
        difficulty: 1,
        metadata: { origin: 'generated', status: 'unmodified' },
      });
    }
  }

  return questions;
}

export function mockGenerateFlashcards(requirements) {
  return requirements.map((req, idx) => ({
    id: `f${idx + 1}`,
    front: `Core concepts of ${req.text}`,
    back: `Key definitions, typical pitfalls, and best practices for ${req.text}.`,
    requirement_ids: [req.id],
    metadata: { origin: 'generated', status: 'unmodified', confidence: 0 },
  }));
}
