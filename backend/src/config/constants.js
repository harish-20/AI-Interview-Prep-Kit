const KIT_STATUS = {
  GENERATING: 'generating',
  READY: 'ready',
  FAILED: 'failed',
};

const REQUIREMENT_KIND = {
  TECHNICAL: 'technical',
  BEHAVIOURAL: 'behavioural',
  DOMAIN: 'domain',
};

const REQUIREMENT_PRIORITY = {
  MUST: 'must',
  NICE: 'nice',
};

const QUESTION_CATEGORY = {
  TECHNICAL: 'technical',
  BEHAVIOURAL: 'behavioural',
  SYSTEM_DESIGN: 'system-design',
  COMPANY_FIT: 'company-fit',
};

module.exports = {
  KIT_STATUS,
  REQUIREMENT_KIND,
  REQUIREMENT_PRIORITY,
  QUESTION_CATEGORY,
};
