const fs = require('fs');

function fixSequences() {
  const file = 'server/sequences.ts';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/currentStep/g, 'currentStepId');
  content = content.replace(/lastEmailedAt/g, 'updatedAt');
  content = content.replace(/subscriberId/g, 'userId');
  content = content.replace(/eq\(sequence_enrollments\.sequenceId, sequenceId\)/g, 'eq(sequence_enrollments.sequenceId, Number(sequenceId))');
  content = content.replace(/sequenceId: sequenceId,/g, 'sequenceId: Number(sequenceId),');
  fs.writeFileSync(file, content, 'utf8');
}

function fixSeoOptimizerTest() {
  const file = 'server/seoOptimizer.test.ts';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/phone: undefined,/g, 'phone: null,');
  content = content.replace(/passwordHash: undefined,/g, 'passwordHash: null,');
  content = content.replace(/googleId: undefined,/g, 'googleId: null,');
  content = content.replace(/emailVerified: false,/g, 'emailVerified: false,');
  content = content.replace(/shareHabitsWithCoach: false,/g, 'shareHabitsWithCoach: false,');
  content = content.replace(/const req = \{/g, 'const req = { ...{} as unknown as Request,');
  content = content.replace(/res: \{\},/g, ''); // remove res from mock ctx
  fs.writeFileSync(file, content, 'utf8');
}

fixSequences();
fixSeoOptimizerTest();
