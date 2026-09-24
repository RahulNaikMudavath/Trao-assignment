import axios from 'axios';
import * as cheerio from 'cheerio';
import { llmClient } from '../llm/llmClient.js';

export async function searchPublicDiscussions(companyName, companyUrl) {
  const result = {
    found: false,
    discussionSummary: 'No verified public interview discussions found.',
    interviewStages: ['Recruiter Screen', 'Technical Interview', 'System Design / Practical Round', 'Values / Leadership Round'],
    sources: [],
  };

  try {
    const parsed = new URL(companyUrl);
    const domainName = parsed.hostname.replace('www.', '').split('.')[0];
    const queryTerm = companyName && companyName !== 'Target Company' ? companyName : domainName;

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${queryTerm} interview process questions glassdoor reddit`)}`;

    try {
      const response = await axios.get(searchUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
      });

      const $ = cheerio.load(response.data);
      const snippets = [];

      $('.result__snippet').slice(0, 4).each((_, el) => {
        const text = $(el).text().trim();
        if (text) snippets.push(text);
      });

      if (snippets.length > 0) {
        result.found = true;
        result.sources.push('https://duckduckgo.com/?q=' + encodeURIComponent(queryTerm));

        const prompt = `Synthesize these public snippets regarding the interview process at ${companyName || domainName}:
${snippets.join('\n- ')}

Return a JSON with:
{
  "summary": string,
  "stages": string[]
}`;
        try {
          const res = await llmClient.generateJson(
            'You are an interview research assistant. Summarize public discussions honestly.',
            prompt,
            { operationName: 'Synthesize public discussions' }
          );
          result.discussionSummary = res.summary || snippets.slice(0, 2).join(' ');
          if (res.stages && res.stages.length > 0) {
            result.interviewStages = res.stages;
          }
        } catch {
          result.discussionSummary = snippets.slice(0, 2).join(' ');
        }
      }
    } catch {
      result.found = false;
      result.discussionSummary = `Public discussion for ${queryTerm} could not be retrieved from public search indexes.`;
    }
  } catch {}

  return result;
}
