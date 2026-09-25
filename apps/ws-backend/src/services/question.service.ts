import { randomUUID } from "node:crypto";
import type { ClientQuestion, QuestionSign, ServerQuestion } from "../types/index.js";

const SIGNS: QuestionSign[] = ["PLUS", "MINUS", "MULTIPLICATION", "DIVIDE"];

export class QuestionService {
  /**
   * Generates a single mathematically sound question with an integer answer.
   */
  public static generateSingleQuestion(): ServerQuestion {
    const sign = SIGNS[Math.floor(Math.random() * SIGNS.length)]!;
    let operation1 = 0;
    let operation2 = 0;
    let systemAnswer = 0;

    switch (sign) {
      case "PLUS": {
        operation1 = Math.floor(Math.random() * 50) + 1; // 1 to 50
        operation2 = Math.floor(Math.random() * 50) + 1; // 1 to 50
        systemAnswer = operation1 + operation2;
        break;
      }

      case "MINUS": {
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        operation1 = Math.max(a, b);
        operation2 = Math.min(a, b);
        systemAnswer = operation1 - operation2;
        break;
      }

      case "MULTIPLICATION": {
        operation1 = Math.floor(Math.random() * 12) + 2; // 2 to 13
        operation2 = Math.floor(Math.random() * 12) + 2; // 2 to 13
        systemAnswer = operation1 * operation2;
        break;
      }

      case "DIVIDE": {
        // Guaranteed clean integer division
        const divisor = Math.floor(Math.random() * 9) + 2; // 2 to 10
        const expectedQuotient = Math.floor(Math.random() * 12) + 1; // 1 to 12
        const dividend = divisor * expectedQuotient;
        operation1 = dividend;
        operation2 = divisor;
        systemAnswer = expectedQuotient;
        break;
      }
    }

    return {
      id: randomUUID(),
      operation1,
      operation2,
      sign,
      systemAnswer,
    };
  }

  /**
   * Generates a set of questions for a game (default: 10 questions).
   */
  public static generateGameQuestions(count = 10): ServerQuestion[] {
    const questions: ServerQuestion[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateSingleQuestion());
    }
    return questions;
  }

  /**
   * Strips the system answer from a question before sending it to the client.
   * Authoritative rule: The client must NEVER receive the answer!
   */
  public static toClientQuestion(question: ServerQuestion): ClientQuestion {
    return {
      id: question.id,
      operation1: question.operation1,
      operation2: question.operation2,
      sign: question.sign,
    };
  }
}
