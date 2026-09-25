import { QuestionService } from "../services/question.service.js";

export const generateQuestion = () => {
  return QuestionService.generateGameQuestions(10);
};