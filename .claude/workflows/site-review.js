export const meta = {
  name: 'site-review',
  description: 'Report-only Clockroom review: eight lens agents in parallel, then a lead that dedupes, verifies each claim in code and runs npm run ci',
  whenToUse: 'A whole-site review pass before a merge to main or a launch. Start a review server first (npm run dev -- --port 3002 with the smoke env from tests/smoke.mjs) or lenses fall back to reading code. args: { base?: string, label?: string, focus?: string }',
  phases: [
    { title: 'Review', detail: 'one report-only agent per lens, in parallel' },
    { title: 'Lead', detail: 'dedupe, verify against code, run npm run ci' },
  ],
}

const LENSES = [
  'security-auditor',
  'design-auditor',
  'accessibility-auditor',
  'booking-ux-reviewer',
  'copy-reviewer',
  'seo-auditor',
  'systems-reviewer',
  'code-quality-reviewer',
]

const base = (args && args.base) || 'http://localhost:3002'
const label = (args && args.label) || 'site-review'
const focus = args && args.focus ? `\nFocus this pass on: ${args.focus}` : ''

const FINDING = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    where: { type: 'string', description: 'file:line, or route @ width' },
    evidence: { type: 'string', description: 'measured value or quoted code' },
    fix: { type: 'string', description: 'smallest change that fixes it' },
    security_relevant: { type: 'boolean' },
  },
  required: ['title', 'severity', 'where', 'evidence', 'fix', 'security_relevant'],
}
const REPORT = {
  type: 'object',
  properties: { findings: { type: 'array', items: FINDING }, notes: { type: 'string' } },
  required: ['findings', 'notes'],
}

phase('Review')
const reports = await parallel(
  LENSES.map((lens) => () =>
    agent(
      `Run your lens over the Clockroom site as it stands in this checkout. Base URL: ${base}. ` +
        `Your output folder is .design-audit/team/${label}/${lens}/. Follow your run rules exactly: report only, ` +
        `no server starts or stops, never data/bookings.db. Return verified findings only, most severe first.${focus}`,
      { agentType: lens, label: lens, phase: 'Review', schema: REPORT }
    ).then((r) => r && { lens, ...r })
  )
)

const done = reports.filter(Boolean)
const missing = LENSES.filter((l) => !done.some((r) => r.lens === l))
if (missing.length) log(`No report from: ${missing.join(', ')}`)

// Barrier: dedupe needs every lens's findings at once. Same place + same title = one finding, lenses merged.
const byKey = new Map()
for (const r of done) {
  for (const f of r.findings) {
    const key = `${f.where.toLowerCase().replace(/\s+/g, '')}|${f.title.toLowerCase().slice(0, 40)}`
    const seen = byKey.get(key)
    if (seen) seen.lenses.push(r.lens)
    else byKey.set(key, { ...f, lenses: [r.lens] })
  }
}
const findings = [...byKey.values()]
log(`${findings.length} findings after dedupe from ${done.length} lenses`)

phase('Lead')
const LEAD = {
  type: 'object',
  properties: {
    confirmed: { type: 'array', items: { ...FINDING, properties: { ...FINDING.properties, lenses: { type: 'array', items: { type: 'string' } }, verified_how: { type: 'string' } }, required: [...FINDING.required, 'verified_how'] } },
    rejected: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } }, required: ['title', 'why'] } },
    ci: { type: 'object', properties: { exit_code: { type: 'number' }, summary: { type: 'string' } }, required: ['exit_code', 'summary'] },
    owner_decisions: { type: 'array', items: { type: 'string' } },
  },
  required: ['confirmed', 'rejected', 'ci', 'owner_decisions'],
}
const lead = await agent(
  `You are the lead reviewer for Clockroom (ORCHESTRATION.md: subagent reports are claims, not facts).\n\n` +
    `Lens reports, already deduplicated by place and title:\n${JSON.stringify(findings, null, 1)}\n\n` +
    `Lens notes:\n${done.map((r) => `- ${r.lens}: ${r.notes}`).join('\n')}\n\n` +
    `1. Merge any remaining duplicates that describe the same defect in different words.\n` +
    `2. Verify every finding yourself against the code (read the cited lines) and, for runtime claims, against ${base}. ` +
    `Recompute any number that matters. Reject what does not survive, and anything PROJECT_CONTEXT.md section 0 records as a decision.\n` +
    `3. Do not edit, commit or push anything. Do not touch data/bookings.db.\n` +
    `4. Finish by running \`npm run ci\` yourself from the repo root (it builds, then serves on port 3100 with a fresh data/ci.db, ` +
    `runs tests/smoke.mjs and design:verify, and stops the server). Report its exit code and the first failure if any, ` +
    `and confirm nothing is left listening on 3100.\n` +
    `5. Anything needing the owner (keys, policy, photos, deploy target) goes in owner_decisions, not confirmed.` +
    (missing.length ? `\nThese lenses returned nothing, say so in the ci summary: ${missing.join(', ')}` : ''),
  { label: 'lead', phase: 'Lead', schema: LEAD, effort: 'high' }
)

return lead
