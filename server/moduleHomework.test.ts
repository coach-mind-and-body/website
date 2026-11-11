import { describe, expect, it } from "vitest";
import {
  homeworkPromptFromHtml,
  planModuleHomeworkAssignments,
  splitHomeworkSection,
} from "../shared/moduleHomework";

const module1 = `
  <h2>Your Habits for this Week</h2>
  <ul><li>Journal daily for 5 minutes</li></ul>
  <hr />
  <h2>Homework</h2>
  <p>Write your "why" &mdash; what do you want to feel by the end of 6 weeks?</p>
  <hr />
  <h2>Why Nothing Has Worked</h2>
  <p>We are going to learn the Feel Great foundations.</p>
`;

describe("module homework prompts", () => {
  it("reads Module 1's written homework and ignores a read-only homework heading", () => {
    expect(homeworkPromptFromHtml(module1)).toBe(
      'Write your "why" — what do you want to feel by the end of 6 weeks?'
    );
    expect(homeworkPromptFromHtml("<h2>Homework</h2><p>Read the guide before our call.</p>")).toBeNull();
    expect(homeworkPromptFromHtml("<h2>Homework</h2><p>Reflect nightly — did I honor my plan?</p>")).toMatch(
      /^Reflect nightly/
    );
  });

  it("splits the homework block out so an answer box can sit under the instructions", () => {
    const parts = splitHomeworkSection(module1);
    expect(parts.prompt).toMatch(/^Write your/);
    expect(parts.homeworkHtml).toContain("<h2>Homework</h2>");
    expect(parts.before).toContain("Your Habits");
    expect(parts.after).toContain("Why Nothing Has Worked");
  });

  it("plans one text-answer task and does not replace a box Lee Anne turned off", () => {
    const inserts = planModuleHomeworkAssignments(
      [
        { id: 1, content: module1 },
        { id: 2, content: "<h2>Homework</h2><p>Read the guide.</p>" },
      ],
      []
    );
    expect(inserts).toEqual([
      {
        moduleId: 1,
        question: 'Write your "why" — what do you want to feel by the end of 6 weeks?',
        order: 1,
      },
    ]);

    const again = planModuleHomeworkAssignments(
      [{ id: 1, content: module1 }],
      [
        {
          moduleId: 1,
          title: "Homework",
          question: "old prompt",
          order: 2,
        },
      ]
    );
    expect(again).toEqual([]);
  });
});
