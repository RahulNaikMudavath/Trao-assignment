export function allocateSchedule(questions, requirements, daysAvailable) {
  const safeDays = Math.max(1, Math.floor(daysAvailable));

  if (questions.length === 0) {
    const emptyDays = [];
    for (let i = 1; i <= safeDays; i++) {
      emptyDays.push({
        day: i,
        focus: `General Preparation & Self-Study Day ${i}`,
        question_ids: [],
        minutes: 45,
      });
    }
    return { days_available: safeDays, days: emptyDays };
  }

  const mustReqIdSet = new Set(
    requirements.filter((r) => r.priority === 'must').map((r) => r.id)
  );

  const scoredQuestions = questions.map((q) => {
    const hasMustReq = q.requirement_ids.some((id) => mustReqIdSet.has(id));
    const priorityScore = hasMustReq ? 100 : 20;
    const difficultyScore = (q.difficulty || 2) * 15;
    return {
      question: q,
      score: priorityScore + difficultyScore,
      estMinutes: q.difficulty === 3 ? 35 : q.difficulty === 2 ? 25 : 15,
    };
  });

  scoredQuestions.sort((a, b) => b.score - a.score);

  const days = [];

  if (safeDays === 1) {
    const allQIds = scoredQuestions.map((sq) => sq.question.id);
    const totalMinutes = scoredQuestions.reduce((acc, curr) => acc + curr.estMinutes, 0);
    const minutes = Math.min(Math.max(totalMinutes, 60), 180);

    return {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: 'Intensive Full-Spectrum Preparation & Must-Have Essentials',
          question_ids: allQIds,
          minutes,
        },
      ],
    };
  }

  if (safeDays <= scoredQuestions.length) {
    const buckets = Array.from({ length: safeDays }, () => []);

    scoredQuestions.forEach((sq, idx) => {
      const dayIdx = Math.min(Math.floor((idx / scoredQuestions.length) * safeDays), safeDays - 1);
      buckets[dayIdx].push(sq);
    });

    for (let i = 0; i < safeDays; i++) {
      if (buckets[i].length === 0 && buckets[0].length > 1) {
        buckets[i].push(buckets[0].pop());
      }
    }

    for (let i = 0; i < safeDays; i++) {
      const dayNum = i + 1;
      const dayItems = buckets[i];
      const qIds = dayItems.map((item) => item.question.id);
      const computedMinutes = dayItems.reduce((acc, item) => acc + item.estMinutes, 0);

      let focus = '';
      if (dayNum === 1) {
        focus = 'Core Must-Have Requirements & High-Complexity Deep Dive';
      } else if (dayNum === safeDays) {
        focus = 'Synthesis, Behavioural Alignment & Final Interview Rehearsal';
      } else {
        const categories = [...new Set(dayItems.map((item) => item.question.category))];
        const catLabel = categories.map((c) => c.replace('-', ' ')).join(' & ');
        focus = `Targeted Mastery: ${catLabel}`;
      }

      days.push({
        day: dayNum,
        focus,
        question_ids: qIds,
        minutes: Math.max(computedMinutes, 30),
      });
    }
  } else {
    for (let i = 0; i < safeDays; i++) {
      const dayNum = i + 1;
      const qIdx = i % scoredQuestions.length;
      const primaryQ = scoredQuestions[qIdx].question;

      let focus = '';
      let qIds = [primaryQ.id];

      if (i < scoredQuestions.length) {
        focus = `Deep Study: ${primaryQ.category.replace('-', ' ')} (${primaryQ.prompt.slice(0, 40)}...)`;
      } else if (i === safeDays - 1) {
        focus = 'Comprehensive Final Mock Review & Readiness Check';
        qIds = scoredQuestions.slice(0, Math.min(3, scoredQuestions.length)).map((sq) => sq.question.id);
      } else {
        const pairQ = scoredQuestions[(i + 1) % scoredQuestions.length].question;
        qIds = [primaryQ.id, pairQ.id];
        focus = `Active Recall & Spaced Practice: ${primaryQ.category} & ${pairQ.category}`;
      }

      days.push({
        day: dayNum,
        focus,
        question_ids: qIds,
        minutes: 45,
      });
    }
  }

  const scheduledQuestionIds = new Set();
  days.forEach((d) => d.question_ids.forEach((qid) => scheduledQuestionIds.add(qid)));

  for (const mustReqId of mustReqIdSet) {
    const candidateQ = questions.find((q) => q.requirement_ids.includes(mustReqId));
    if (candidateQ && !scheduledQuestionIds.has(candidateQ.id)) {
      days[0].question_ids.unshift(candidateQ.id);
      scheduledQuestionIds.add(candidateQ.id);
    }
  }

  return {
    days_available: safeDays,
    days,
  };
}
