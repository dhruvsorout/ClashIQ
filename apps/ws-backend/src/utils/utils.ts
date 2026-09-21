import { Question, QuestionSign } from "../types";

export const generateQuestion = (): Question[] => {
    const questions: Question[] = [];
    const signs = [
        "MINUS", 
        "PLUS", 
        "MULTIPLICATION", 
        "DIVIDE"
    ];
    
    for(let i = 0; i <= 60; i++){
        const randomOperation1 = Math.floor(Math.random() * 10);
        const randomOperation2 = Math.floor(Math.random() * 20);

        const randomSign = 
            signs[Math.floor(Math.random() * signs.length)]!;

        let answer;

        switch (randomSign) {
            case "DIVIDE":
                answer = randomOperation1/randomOperation2;
                break;
            
            case "MULTIPLICATION":
                answer = randomOperation1 * randomOperation2;
                break;

            case "PLUS":
                answer = randomOperation1 + randomOperation2;
                break;

            case "MINUS":
                answer = randomOperation1 - randomOperation2;
                break;
        
            default:
                throw new Error(`Invalid question sign: ${randomSign}`);
        }

        questions.push({
            id: crypto.randomUUID(),
            sign: randomSign,
            operation1: randomOperation1,
            operation2: randomOperation2,
            answer
        })
    }

    return questions;
};